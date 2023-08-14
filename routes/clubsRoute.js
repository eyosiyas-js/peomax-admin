const express = require("express");
const Club = require("../models/Club");
const Event = require("../models/Event");
const {
  createDiningService,
  editDiningService,
} = require("../controllers/diningService");
const managerChecker = require("../middleware/managerChecker");

const multer = require("multer");
const { existsSync, mkdirSync } = require("fs");
const { join } = require("path");

const storage = join(process.cwd(), "./uploads");

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
    const count = parseInt(req.query.count) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;
    const clubsCount = await Club.countDocuments({ status: "approved" });
    const totalPages = Math.ceil(clubsCount / count);
    const clubs = await Club.find({ status: "approved" })
      .skip(skip)
      .limit(count);
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
      status: "approved",
    });

    if (!club)
      return res
        .status(404)
        .send({ error: `No club with ID: ${req.params.id}` });

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
    await createDiningService(req, res, Club);
  }
);

router.put(
  "/:id/edit",
  managerChecker,
  uploads.array("images", 10),
  async (req, res) => {
    await editDiningService(req, res, Club);
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

    club.status = "deleted";
    await club.save();

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
      status: { $ne: "deleted" },
    });

    res.send(events);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error fetching events" });
  }
});

router.get("/:id/programs", async (req, res) => {
  try {
    if (!req.params.id)
      return res.status(404).send({ error: "No id provided" });

    const events = await Event.find({
      ID: req.params.id,
      category: "club",
      program: true,
      status: { $ne: "deleted" },
    });

    res.send(events);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error fetching events" });
  }
});

module.exports = router;
