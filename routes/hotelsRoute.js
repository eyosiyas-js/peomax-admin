const express = require("express");
const Hotel = require("../models/Hotel");
const managerChecker = require("../middleware/managerChecker");
const { uid } = require("uid");

const multer = require("multer");
const { unlinkSync, existsSync, mkdirSync } = require("fs");
const { join } = require("path");
const uploadFile = require("../utils/upload");

const storage = join(process.cwd(), "./uploads");
const formats = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/bmp",
  "image/webp",
  "image/avif",
  "image/tiff",
  "image/svg+xml",
  "image/x-icon",
];

if (!existsSync(storage)) {
  mkdirSync(storage);
}

const uploads = multer({ dest: storage });

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;
    const hotelsCount = await Hotel.countDocuments({});
    const totalPages = Math.ceil(hotelsCount / count);
    const hotels = await Hotel.find({}).skip(skip).limit(count);
    res.send({
      page,
      totalPages,
      hotelsCount,
      hotels,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting hotels" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findOne({
      hotelID: req.params.id,
    });
    res.send(hotel.toObject());
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error: `Couldn't find a hotel with the ID: ${req.params.id}`,
    });
  }
});

router.get("/:id/related", async (req, res) => {
  try {
    const hotel = await Hotel.findOne({
      hotelID: req.params.id,
    });

    if (!hotel)
      return res
        .status(400)
        .send({ error: `No hotel found with ID:  ${hotelID}` });

    const related_hotels = await Hotel.find({
      $and: [
        { hotelID: { $ne: hotel.hotelID } },
        {
          $or: [
            { name: { $regex: new RegExp(hotel.name, "i") } },
            { managerID: hotel.managerID },
            {
              location: {
                $regex: new RegExp(hotel.location, "i"),
              },
            },
            { rating: { $regex: new RegExp(hotel.rating, "i") } },
          ],
        },
      ],
    });

    if (related_hotels.length == 0)
      return res.status(400).send({ error: "No related hotels found" });
    res.send(related_hotels);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error finding related hotels" });
  }
});

router.post(
  "/create",
  managerChecker,
  uploads.array("images", 10),
  async (req, res) => {
    try {
      const files = await req.files;
      let hasInvalidFile = false;
      const images = await Promise.all(
        files.map(async (file) => {
          const { path, filename, mimetype } = file;
          if (!formats.includes(mimetype)) {
            unlinkSync(path);
            hasInvalidFile = true;
            return;
          } else {
            const response = await uploadFile(path, filename, mimetype);
            if (response.status !== "error") return response.url;
            if (response.status !== "error") return "none";
          }
        })
      );

      if (hasInvalidFile)
        return res.status(400).send({ error: "Invalid file type detected" });

      files.map((file) => unlinkSync(file.path));

      const {
        name,
        description,
        price,
        location,
        tables,
        availableSpots,
        totalSpots,
        openingTime,
        closingTime,
        numReviews,
        totalBooks,
      } = req.body;

      const managerID = req.user.userID;

      const hotel = new Hotel({
        name: name,
        description: description,
        price: price,
        location: location,
        branches: req.body.branches ? req.body.branches : [],
        image: images[0],
        images: images,
        rating: req.body.rating ? req.body.rating : 0,
        tables: tables,
        managerID: managerID,
        availableSpots: availableSpots,
        totalSpots: totalSpots,
        totalSpots: totalBooks,
        openingTime: openingTime,
        closingTime: closingTime,
        restaurants: req.body.restaurants ? req.body.restaurants : [],
        numReviews: numReviews,
        totalBooks: totalBooks,
        hotelID: uid(16),
      });

      await hotel.save();

      res.send(hotel);
    } catch (error) {
      res.status(500).send({ error: "Error adding hotel" });
      console.log(error);
    }
  }
);

router.put(
  "/:id/edit",
  managerChecker,
  uploads.array("images", 10),
  async (req, res) => {
    async function update(req, res, images) {
      const urls = images || [];
      const {
        name,
        description,
        location,
        tables,
        availableSpots,
        totalSpots,
        openingTime,
        closingTime,
        numReviews,
        totalBooks,
      } = req.body;

      const hotel = await Hotel.findOne({
        hotelID: req.params.id,
      });

      if (!hotel)
        return res
          .status(404)
          .send({ error: `No hotel with ID: ${req.params.id} found` });

      if (hotel.managerID !== req.user.userID)
        return res.status(403).send({ error: "Unauthorized" });

      hotel.name = name ?? hotel.name;
      hotel.description = description ?? hotel.description;
      hotel.location = location ?? hotel.location;
      hotel.branches = req.body.branches || [];
      hotel.image = urls.length !== 0 ? urls[0] : hotel.image;
      hotel.images = urls.length !== 0 ? urls : hotel.images;
      hotel.rating = req.body.rating || 0;
      hotel.tables = tables ?? hotel.tables;
      hotel.availableSpots = availableSpots ?? hotel.availableSpots;
      hotel.totalSpots = totalSpots ?? hotel.totalSpots;
      hotel.totalBooks = totalBooks ?? hotel.totalSpots;
      hotel.openingTime = openingTime ?? hotel.openingTime;
      hotel.closingTime = closingTime ?? hotel.closingTime;
      hotel.restaurants = req.body.restaurants || [];
      hotel.numReviews = numReviews ?? hotel.numReviews;
      hotel.totalBooks = totalBooks ?? hotel.totalBooks;

      await hotel.save();

      res.send(hotel.toObject());
    }

    try {
      if (req.query.files == "true") {
        const files = await req.files;
        let hasInvalidFile = false;
        urls = await Promise.all(
          files.map(async (file) => {
            const { path, filename, mimetype } = file;
            if (!formats.includes(mimetype)) {
              unlinkSync(path);
              hasInvalidFile = true;
              return "none";
            } else {
              const response = await uploadFile(path, filename, mimetype);
              if (response.status !== "error") return response.url;
              if (response.status !== "error") return "none";
            }
          })
        );

        if (hasInvalidFile) {
          return res.status(400).send({ error: "Invalid file type" });
        }

        files.map((file) => unlinkSync(file.path));
        update(req, res, urls);
      } else {
        update(req, res);
      }
    } catch (error) {
      res.status(500).send({ error: "Error updating hotel" });
      console.log(error);
    }
  }
);

router.delete("/:id/delete", managerChecker, async (req, res) => {
  try {
    const hotel = await Hotel.findOne({
      hotelID: req.params.id,
      managerID: req.user.userID,
    });

    if (!hotel) return res.status(404).send("hotel not found");

    if (hotel.managerID !== req.user.userID)
      return res.status(403).send({ error: "Unauthorized" });

    await hotel.remove();

    res.send({
      message: `hotel with ID ${req.params.id} has been deleted`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error deleting hotel" });
  }
});

module.exports = router;
