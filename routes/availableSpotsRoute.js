const express = require("express");
const router = express.Router();
const findPlace = require("../utils/findPlace");
const availableSpots = require("../utils/availableSpots");

router.get("/", async (req, res) => {
  try {
    const { date, ID, category } = req.query;
    if (!date || !ID || !category)
      return res.status(400).send({ error: "ID/category/date is missing" });

    const place = await findPlace(ID, category);
    if (!place) return res.status(404).send({ error: `${category} not found` });

    const spots = await availableSpots(date, place);

    res.send({ spots });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error getting available-spots" });
  }
});

module.exports = router;
