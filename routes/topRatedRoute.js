const express = require("express");
const Restaurant = require("../models/Restaurant");
const Hotel = require("../models/Hotel");
const Bar = require("../models/Bar");
const Club = require("../models/Club");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const hotels = await Hotel.find({ rating: { $gt: 4 } });
    const restaurants = await Restaurant.find({ rating: { $gt: 4 } });
    const bars = await Bar.find({ rating: { $gt: 4 } });
    const clubs = await Club.find({ rating: { $gt: 4 } });
    const featured = hotels.concat(restaurants, bars, clubs);

    const count = parseInt(req.query.count) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;
    const featuredCount = featured.length;
    const totalPages = Math.ceil(featuredCount / count);

    const paginatedData = featured.slice(skip, skip + count);

    res.send({
      page,
      totalPages,
      featuredCount,
      featured: paginatedData,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't get all spots" });
  }
});

module.exports = router;
