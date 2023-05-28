const express = require("express");
const Restaurant = require("../models/Restaurant");
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
    const count = parseInt(req.query.count) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;
    const restaurantsCount = await Restaurant.countDocuments({});
    const totalPages = Math.ceil(restaurantsCount / count);
    const restaurants = await Restaurant.find({}).skip(skip).limit(count);
    res.send({
      page,
      totalPages,
      restaurants,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting restaurants" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      restaurantID: req.params.id,
    });
    res.send(restaurant.toObject());
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error: `Couldn't find a restaurant with the ID: ${req.params.id}`,
    });
  }
});

router.get("/:id/related", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      restaurantID: req.params.id,
    });

    if (!restaurant)
      return res
        .status(400)
        .send({ error: `No restaurant found with ID:  ${restaurantID}` });

    const related_restaurants = await Restaurant.find({
      $and: [
        { restaurantID: { $ne: restaurant.restaurantID } },
        {
          $or: [
            { name: { $regex: new RegExp(restaurant.name, "i") } },
            { managerID: restaurant.managerID },
            {
              location: {
                $regex: new RegExp(restaurant.location, "i"),
              },
            },
            { rating: { $regex: new RegExp(restaurant.rating, "i") } },
          ],
        },
      ],
    });

    if (related_restaurants.length == 0)
      return res.status(400).send({ error: "No related restaurants found" });
    res.send(related_restaurants);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error finding related restaurants" });
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

      const restaurant = new Restaurant({
        name: name,
        description: description,
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
        numReviews: numReviews,
        totalBooks: totalBooks,
        restaurantID: uid(16),
      });

      await restaurant.save();

      res.send(restaurant);
    } catch (error) {
      res.status(500).send({ error: "Error adding restaurant" });
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

      const restaurant = await Restaurant.findOne({
        restaurantID: req.params.id,
      });

      if (!restaurant)
        return res
          .status(403)
          .send({ error: `No restaurant with ID: ${req.params.id} found` });

      if (restaurant.managerID !== req.user.userID)
        return res.status(403).send({ error: "Unauthorized" });

      restaurant.name = name ?? restaurant.name;
      restaurant.description = description ?? restaurant.description;
      restaurant.location = location ?? restaurant.location;
      restaurant.branches = req.body.branches || [];
      restaurant.image = urls.length !== 0 ? urls[0] : restaurant.image;
      restaurant.images = urls.length !== 0 ? urls : restaurant.images;
      restaurant.rating = req.body.rating || 0;
      restaurant.tables = tables ?? restaurant.tables;
      restaurant.availableSpots = availableSpots ?? restaurant.availableSpots;
      restaurant.totalSpots = totalSpots ?? restaurant.totalSpots;
      restaurant.totalBooks = totalBooks ?? restaurant.totalSpots;
      restaurant.openingTime = openingTime ?? restaurant.openingTime;
      restaurant.closingTime = closingTime ?? restaurant.closingTime;
      restaurant.numReviews = numReviews ?? restaurant.numReviews;
      restaurant.totalBooks = totalBooks ?? restaurant.totalBooks;

      await restaurant.save();

      res.send(restaurant.toObject());
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
      res.status(500).send({ error: "Error updating restaurant" });
      console.log(error);
    }
  }
);

router.delete("/:id/delete", managerChecker, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      restaurantID: req.params.id,
    });

    if (!restaurant) return res.status(404).send("restaurant not found");

    if (restaurant.managerID !== req.user.userID)
      return res.status(403).send({ error: "Unauthorized" });

    await restaurant.remove();

    res.send({
      message: `restaurant with ID ${req.params.id} has been deleted`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error deleting restaurant" });
  }
});

module.exports = router;
