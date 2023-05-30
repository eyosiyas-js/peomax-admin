const express = require("express");
const Restaurant = require("../models/Restaurant.js");
const Hotel = require("../models/Hotel");
const Bar = require("../models/Bar");
const Club = require("../models/Club");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const regex = new RegExp(req.query.q, "i");

    if (!req.query.q)
      return res.status(404).send({ error: "No text proivded" });

    const restaurants = await Restaurant.find({
      $or: [
        { category: { $regex: regex } },
        { name: { $regex: regex } },
        { location: { $regex: regex } },
      ],
    })
      .sort({ name: 1 })
      .skip(startIndex)
      .limit(limit);

    const hotels = await Hotel.find({
      $or: [
        { category: { $regex: regex } },
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { location: { $regex: regex } },
      ],
    })
      .sort({ name: 1 })
      .skip(startIndex)
      .limit(limit);

    const bars = await Bar.find({
      $or: [
        { category: { $regex: regex } },
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { location: { $regex: regex } },
      ],
    })
      .sort({ name: 1 })
      .skip(startIndex)
      .limit(limit);

    const clubs = await Club.find({
      $or: [
        { category: { $regex: regex } },
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { location: { $regex: regex } },
      ],
    })
      .sort({ name: 1 })
      .skip(startIndex)
      .limit(limit);

    const items = hotels.concat(restaurants, bars, clubs);

    const itemsCount = items.length;

    const results = {
      page: page,
      limit: limit,
      totalPages: Math.ceil(itemsCount / limit),
      itemsCount: itemsCount,
      items: items,
    };

    res.send(results);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: `Could not search ${req.query.q}.` });
  }
});

module.exports = router;
