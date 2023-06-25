const express = require("express");
const Club = require("../models/Club");
const Event = require("../models/Event");
const managerChecker = require("../middleware/managerChecker");
const { uid } = require("uid");

const multer = require("multer");
const { unlinkSync, existsSync, mkdirSync } = require("fs");
const { join } = require("path");
const uploadFile = require("../utils/upload");

const storage = join(process.cwd(), "./uploads");
const formats = require("../utils/formats");

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
    const clubsCount = await Club.countDocuments({});
    const totalPages = Math.ceil(clubsCount / count);
    const clubs = await Club.find({}).skip(skip).limit(count);
    res.send({
      page,
      totalPages,
      clubsCount,
      clubs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting clubs" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const club = await Club.findOne({
      ID: req.params.id,
    });
    res.send(club.toObject());
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error: `Couldn't find a club with the ID: ${req.params.id}`,
    });
  }
});

router.get("/:id/related", async (req, res) => {
  try {
    const club = await Club.findOne({
      ID: req.params.id,
    });

    if (!club)
      return res.status(400).send({ error: `No club found with ID:  ${ID}` });

    const related_clubs = await Club.find({
      $and: [
        { ID: { $ne: club.ID } },
        {
          $or: [
            { name: { $regex: new RegExp(club.name, "i") } },
            { managerID: club.managerID },
            {
              location: {
                $regex: new RegExp(club.location, "i"),
              },
            },
            { rating: { $regex: new RegExp(club.rating, "i") } },
          ],
        },
      ],
    });

    if (related_clubs.length == 0)
      return res.status(400).send({ error: "No related clubs found" });
    res.send(related_clubs);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error finding related clubs" });
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

        crossStreet,
        neighborhood,
        cuisines,
        diningStyle,
        dressCode,
        parkingDetails,
        publicTransit,
        paymentOptions,
        additional,
        phoneNumber,
        website,
      } = req.body;

      const managerID = req.user.userID;

      const club = new Club({
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
        ID: uid(16),

        crossStreet: crossStreet,
        neighborhood: neighborhood,
        cuisines: cuisines,
        diningStyle: diningStyle,
        dressCode: dressCode,
        parkingDetails: parkingDetails,
        publicTransit: publicTransit,
        paymentOptions: paymentOptions,
        additional: additional,
        phoneNumber: phoneNumber,
        website: website,
      });

      await club.save();

      res.send(club);
    } catch (error) {
      res.status(500).send({ error: "Error adding club" });
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

        crossStreet,
        neighborhood,
        cuisines,
        diningStyle,
        dressCode,
        parkingDetails,
        publicTransit,
        paymentOptions,
        additional,
        phoneNumber,
        website,
      } = req.body;

      const club = await Club.findOne({
        ID: req.params.id,
      });

      if (!club)
        return res
          .status(403)
          .send({ error: `No club with ID: ${req.params.id} found` });

      if (club.managerID !== req.user.userID)
        return res.status(403).send({ error: "Unauthorized" });

      club.name = name ?? club.name;
      club.description = description ?? club.description;
      club.location = location ?? club.location;
      club.branches = req.body.branches || [];
      club.image = urls.length !== 0 ? urls[0] : club.image;
      club.images = urls.length !== 0 ? urls : club.images;
      club.rating = req.body.rating || 0;
      club.tables = tables ?? club.tables;
      club.availableSpots = availableSpots ?? club.availableSpots;
      club.totalSpots = totalSpots ?? club.totalSpots;
      club.totalBooks = totalBooks ?? club.totalSpots;
      club.openingTime = openingTime ?? club.openingTime;
      club.closingTime = closingTime ?? club.closingTime;
      club.numReviews = numReviews ?? club.numReviews;
      club.totalBooks = totalBooks ?? club.totalBooks;

      club.crossStreet = crossStreet ?? club.crossStreet;
      club.neighborhood = neighborhood ?? club.neighborhood;
      club.cuisines = cuisines ?? club.cuisines;
      club.diningStyle = diningStyle ?? club.diningStyle;
      club.dressCode = dressCode ?? club.dressCode;
      club.parkingDetails = parkingDetails ?? club.parkingDetails;
      club.publicTransit = publicTransit ?? club.publicTransit;
      club.paymentOptions = paymentOptions ?? club.paymentOptions;
      club.additional = additional ?? club.additional;
      club.phoneNumber = phoneNumber ?? club.phoneNumber;
      club.website = website ?? club.website;

      await club.save();

      res.send(club.toObject());
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
      res.status(500).send({ error: "Error updating club" });
      console.log(error);
    }
  }
);

router.delete("/:id/delete", managerChecker, async (req, res) => {
  try {
    const club = await Club.findOne({
      ID: req.params.id,
    });

    if (!club) return res.status(404).send("club not found");

    if (club.managerID !== req.user.userID)
      return res.status(403).send({ error: "Unauthorized" });

    await club.remove();

    res.send({
      message: `club with ID ${req.params.id} has been deleted`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error deleting club" });
  }
});

router.get("/:id/events", async (req, res) => {
  try {
    if (!req.params.id)
      return res.status(404).send({ error: "No id provided" });

    const events = await Event.find({
      ID: req.params.id,
      category: "club",
    });

    res.send(events);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error fetching events" });
  }
});

module.exports = router;
