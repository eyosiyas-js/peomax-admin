const express = require("express");
const Restaurant = require("../models/Restaurant");
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
    let query = {};

    if (req.user.role !== "admin") {
      query.status = "approved";
    }

    const restaurantsCount = await Restaurant.countDocuments(query);
    const totalPages = Math.ceil(restaurantsCount / count);
    const restaurants = await Restaurant.find(query).skip(skip).limit(count);
    res.send({
      page,
      totalPages,
      restaurantsCount,
      restaurants,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting restaurants" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    let query = { ID: req.params.id };

    if (req.user.role !== "admin") {
      query.status = "approved";
    }

    const restaurant = await Restaurant.findOne(query);

    if (!restaurant) {
      return res
        .status(404)
        .send({ error: `No restaurant with ID: ${req.params.id}` });
    }

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
      ID: req.params.id,
    });

    if (!restaurant)
      return res
        .status(400)
        .send({ error: `No restaurant found with ID:  ${ID}` });

    const related_restaurants = await Restaurant.find({
      $and: [
        { ID: { $ne: restaurant.ID } },
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
    await createDiningService(req, res, Restaurant);
  }
);

router.put(
  "/:id/edit",
  managerChecker,
  uploads.array("images", 10),
  async (req, res) => {
    await editDiningService(req, res, Restaurant);
  }
);

router.delete("/:id/delete", managerChecker, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      ID: req.params.id,
    });

    if (!restaurant) return res.status(404).send("restaurant not found");

    if (restaurant.managerID !== req.user.userID)
      return res.status(403).send({ error: "Unauthorized" });

    if (restaurant.status == "deleted")
      return res.status(400).send({ error: "restaurant is already removed" });

    restaurant.status = "deleted";
    await restaurant.save();

    res.send({
      message: `restaurant with ID ${req.params.id} has been deleted`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error deleting restaurant" });
  }
});

router.get("/:id/events", async (req, res) => {
  try {
    if (!req.params.id)
      return res.status(404).send({ error: "No id provided" });

    const events = await Event.find({
      ID: req.params.id,
      category: "restaurant",
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
      category: "restaurant",
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
