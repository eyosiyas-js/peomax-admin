const express = require("express");
const Event = require("../models/Event");
const findPlace = require("../utils/findPlace");
const checkAuthorization = require("../utils/checkAuthorization");
const availableSpots = require("../utils/availableSpots");
const superVisorChecker = require("../middleware/superVisorChecker");
const { uid } = require("uid");

const multer = require("multer");
const { unlinkSync, existsSync, mkdirSync } = require("fs");
const { join } = require("path");
const uploadFile = require("../utils/upload");
const { validateEvent, validateEditEvent } = require("../utils/validator");
const { hasDatePassed } = require("../utils/hasPassed");

const storage = join(process.cwd(), "./uploads");
const formats = require("../utils/formats");

if (!existsSync(storage)) {
  mkdirSync(storage);
}

const uploads = multer({
  dest: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const events = await Event.find({});
    events.sort((a, b) => b.totalSpots - a.totalSpots);

    res.send(events);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't get all events" });
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

router.get("/:id/available-spots", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) return res.status(400).send({ error: "Date is required" });

    const event = await Event.find({ eventID: req.params.id });
    if (!event)
      return res
        .status(404)
        .send({ error: `No event found with id: ${req.params.id}` });

    const spots = await availableSpots(date, event, "event");

    res.send({ spots });

    res.send(event);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't get all spots" });
  }
});

router.post(
  "/create",
  superVisorChecker,
  uploads.array("images", 10),
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
        return res.status(403).send({ error: "Unauthorized action" });

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
        endDate,
        totalSpots,
        isFullDay,
        eventStart,
        eventEnd,
        price,
        premiumPrice,
        program,
      } = req.body;

      if (hasDatePassed(date))
        return res.status(400).send({ error: "Invalid date" });

      if (hasDatePassed(endDate))
        return res.status(400).send({ error: "Invalid date" });

      if (hasDatePassed(endDate, date))
        return res
          .status(400)
          .send({ error: "End date can not be set before start date" });

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
        availableSpots: totalSpots,
        isFullDay: isFullDay ? isFullDay : false,
        eventStart: eventStart,
        eventEnd: eventEnd,
        price: price,
        endDate,
        program: program == "true",
        eventID: uid(16),
      });

      if (premiumPrice) {
        event.premiumPrice = premiumPrice;
      }

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
  uploads.array("images", 10),
  async (req, res) => {
    try {
      const valid = validateEditEvent(req.body);
      if (!valid.success) return res.status(400).send({ error: valid.message });

      const managerID = req.user.userID;
      const place = await findPlace(req.body.ID, req.body.category);
      if (!place)
        return res
          .status(400)
          .send({ error: `${req.body.category} not found` });

      const isAuthorized = checkAuthorization(managerID, place);
      if (!isAuthorized)
        return res.status(403).send({ error: "Unauthorized action" });

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
        endDate,
        totalSpots,
        availableSpots,
        eventStart,
        eventEnd,
        price,
        premiumPrice,
        program,
      } = req.body;

      const event = await Event.findOne({ eventID: req.params.id });

      if (date && hasDatePassed(date))
        return res.status(400).send({ error: "Invalid date" });

      if (endDate && hasDatePassed(endDate))
        return res.status(400).send({ error: "Invalid date" });

      if (date && endDate && hasDatePassed(endDate, date))
        return res
          .status(400)
          .send({ error: "End date can not be set before start date" });

      event.name = name ?? event.name;
      event.description = description ?? event.description;
      event.date = date ?? event.date;
      event.endDate = endDate ?? event.endDate;
      event.image = urls.length !== 0 ? urls[0] : event.image;
      event.images = urls.length !== 0 ? urls : event.images;
      event.availableSpots = availableSpots ?? event.availableSpots;
      event.totalSpots = totalSpots ?? event.totalSpots;
      event.eventStart = eventStart ?? event.eventStart;
      event.price = price ?? event.price;
      event.eventEnd = eventEnd ?? event.eventEnd;
      event.premiumPrice = premiumPrice ?? event.premiumPrice;
      event.program = program == "true" ?? event.program;

      await event.save();

      res.send(event);
    } catch (error) {
      res.status(500).send({ error: "Error creating an event" });
      console.log(error);
    }
  }
);

router.delete("/:id", superVisorChecker, async (req, res) => {
  try {
    const event = await Event.findOne({ eventID: req.params.id });
    if (!event)
      return res
        .status(404)
        .send({ error: `No event found with id: ${req.params.id}` });

    const place = await findPlace(event.ID, event.category);
    if (!place)
      return res
        .status(400)
        .send({ error: `No ${event.category} with ID: ${event.ID}` });

    const isAuthorized = await checkAuthorization(req.user.userID, place);
    if (!isAuthorized)
      return res.status(403).send({ error: "Unauthorized action" });

    if (event.status == "deleted")
      return res.status(400).send({ error: "Event is already deleted" });

    event.status = "deleted";
    await event.save();

    res.send({ message: "Event removed" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't get all spots" });
  }
});

module.exports = router;
