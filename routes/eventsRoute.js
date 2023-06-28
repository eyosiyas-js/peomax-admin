const express = require("express");
const Event = require("../models/Event");
const findPlace = require("../utils/findPlace");
const checkAuthorization = require("../utils/checkAuthorization");
const superVisorChecker = require("../middleware/superVisorChecker");
const { uid } = require("uid");

const multer = require("multer");
const { unlinkSync, existsSync, mkdirSync } = require("fs");
const { join } = require("path");
const uploadFile = require("../utils/upload");
const { validateEvent, validateEditEvent } = require("../utils/validator");

const storage = join(process.cwd(), "./uploads");
const formats = require("../utils/formats");

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
  superVisorChecker,
  uploads.array("images", 5),
  async (req, res) => {
    try {
      const valid = await validateEvent(req.body);
      if (!valid.success) return res.status(400).send({ error: valid.message });

      const managerID = req.user.userID;

      const place = await findPlace(req.body.ID, req.body.category);
      if (!place)
        return res.status(400).send({ error: `${category} not found` });

      const isAuthorized = checkAuthorization(managerID, place);
      if (!isAuthorized)
        return res.status(401).send({ error: "Unauthorized action" });

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
        isFullDay,
        eventStart,
        eventEnd,
        price,
        premiumPrice,
      } = req.body;

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

router.put(
  "/:id/edit",
  superVisorChecker,
  uploads.array("images", 5),
  async (req, res) => {
    try {
      const valid = validateEditEvent(req.body);
      if (!valid.success) return res.status(400).send({ error: valid.message });

      const managerID = req.user.userID;
      const place = await findPlace(req.body.ID, req.body.category);
      if (!place)
        return res.status(400).send({ error: `${category} not found` });

      const isAuthorized = checkAuthorization(managerID, place);
      if (!isAuthorized)
        return res.status(401).send({ error: "Unauthorized action" });

      let urls = [];
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
      }

      const {
        name,
        description,
        date,
        totalSpots,
        availableSpots,
        eventStart,
        eventEnd,
        price,
        premiumPrice,
      } = req.body;

      const event = await Event.findOne({ eventID: req.params.id });

      event.name = name ?? event.name;
      event.description = description ?? event.description;
      event.date = date ?? event.date;
      event.image = urls.length !== 0 ? urls[0] : event.image;
      event.images = urls.length !== 0 ? urls : event.images;
      event.availableSpots = availableSpots ?? event.availableSpots;
      event.totalSpots = totalSpots ?? event.totalSpots;
      event.eventStart = eventStart ?? event.eventStart;
      event.price = price ?? event.price;
      event.eventEnd = eventEnd ?? event.eventEnd;
      event.premiumPrice = premiumPrice ?? event.premiumPrice;

      await event.save();

      res.send(event);
    } catch (error) {
      res.status(500).send({ error: "Error creating an event" });
      console.log(error);
    }
  }
);

module.exports = router;
