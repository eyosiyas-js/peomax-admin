const express = require("express");
const haversine = require("haversine");
const Restaurant = require("../models/Restaurant");
const Hotel = require("../models/Hotel");
const Bar = require("../models/Bar");
const Club = require("../models/Club");

const router = express.Router();

async function isUnderOneKM(start, end) {
  const result = haversine(start, end, { threshold: 1000, unit: "meter" });
  return result;
}

router.get("/", async (req, res) => {
  const hotels = await Hotel.find({});
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude)
    return res.status(400).send({ error: "Invalid geolocation data" });

  const start = {
    latitude,
    longitude,
  };

  const items = hotels;
  const nearbyItems = [];

  for (const item of items) {
    const end = item.geoLocation;
    const isNearby = await isUnderOneKM(start, end);

    if (isNearby) nearbyItems.push(item);
  }

  res.send(nearbyItems);

  try {
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't get nearby spots" });
  }
});

module.exports = router;
