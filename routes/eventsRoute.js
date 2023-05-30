const express = require("express");
const Event = require("../models/Event");
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
    const events = await Event.find({});
    const count = parseInt(req.query.count) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;
    const eventsCount = events.length;
    const totalPages = Math.ceil(eventsCount / count);

    const paginatedData = events.slice(skip, skip + count);

    res.send({
      page,
      totalPages,
      eventsCount,
      events: paginatedData,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't get all spots" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const event = await Event.find({ eventID: req.params.id });

    if (!event)
      return res
        .status(404)
        .send({ error: `No event found with id: ${req.params.id}` });

    res.send(event);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't get all spots" });
  }
});

router.post(
  "/create",
  managerChecker,
  uploads.array("images", 5),
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
        category,
        ID,
        date,
        totalSpots,
        totalBooks,
        isFullDay,
        eventStart,
        eventEnd,
        price,
        premiumPrice,
      } = req.body;

      const managerID = req.user.userID;

      const event = new Event({
        name: name,
        description: description,
        category: category,
        image: images[0],
        images: images,
        ID: ID,
        date: date,
        managerID: managerID,
        totalSpots: totalSpots,
        isFullDay: isFullDay ? isFullDay : false,
        eventStart: eventStart,
        eventEnd: eventEnd,
        price: price,
        premiumPrice: premiumPrice,
        totalBooks: totalBooks,
        eventID: uid(16),
      });

      await event.save();

      res.send(event);
    } catch (error) {
      res.status(500).send({ error: "Error creating an event" });
      console.log(error);
    }
  }
);

module.exports = router;
