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
  const hotelsPromise = Hotel.find({});
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude))
    return res.status(400).send({ error: "Invalid geolocation data" });

  const start = {
    latitude,
    longitude,
  };

  const restaurantsPromise = Restaurant.find({});
  const clubsPromise = Club.find({});
  const barsPromise = Bar.find({});

  const [hotels, restaurants, clubs, bars] = await Promise.all([
    hotelsPromise,
    restaurantsPromise,
    clubsPromise,
    barsPromise,
  ]);

  const items = hotels.concat(restaurants, clubs, bars);

  const nearbyItems = await Promise.all(
    items.map(async (item) => {
      const end = item.geoLocation;
      const isNearby = await isUnderOneKM(start, end);
      if (isNearby) return item;
    })
  );

  res.send(nearbyItems.filter((item) => item));

  try {
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't get nearby spots" });
  }
});

module.exports = router;
