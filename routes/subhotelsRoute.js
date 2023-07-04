const express = require("express");
const Hotel = require("../models/Hotel");
const Restaurant = require("../models/Restaurant");
const Club = require("../models/Club");
const Bar = require("../models/Bar");
const managerChecker = require("../middleware/managerChecker");
const router = express.Router();

router.get("/", managerChecker, async (req, res) => {
  try {
    const bars = await Bar.find({
      managerID: req.user.userID,
      subHotel: true,
    });
    const clubs = await Club.find({
      managerID: req.user.userID,
      subHotel: true,
    });
    const hotels = await Hotel.find({
      managerID: req.user.userID,
      subHotel: true,
    });
    const restaurants = await Restaurant.find({
      managerID: req.user.userID,
      subHotel: true,
    });

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
    res.status(400).send({ error: "Couldn't get all sub-hotels" });
  }
});

module.exports = router;
