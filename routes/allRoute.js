const express = require("express");
const Restaurant = require("../models/Restaurant");
const Hotel = require("../models/Hotel");
const Bar = require("../models/Bar");
const Club = require("../models/Club");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const hotels = await Hotel.find({ status: "approved" });
    const restaurants = await Restaurant.find({ status: "approved" });
    const bars = await Bar.find({ status: "approved" });
    const clubs = await Club.find({ status: "approved" });
    const items = hotels.concat(restaurants, bars, clubs);

    const count = parseInt(req.query.count) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;
    const itemsCount = items.length;
    const totalPages = Math.ceil(itemsCount / count);

    const paginatedData = items.slice(skip, skip + count);

    res.send({
      page,
      totalPages,
      itemsCount,
      items: paginatedData,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't get all spots" });
  }
});

module.exports = router;
