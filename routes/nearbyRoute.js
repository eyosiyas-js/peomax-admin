const express = require("express");
const haversine = require("haversine");
const Restaurant = require("../models/Restaurant");
const Hotel = require("../models/Hotel");
const Bar = require("../models/Bar");
const Club = require("../models/Club");

const router = express.Router();

async function getDistance(start, end) {
  const result = haversine(start, end, { unit: "meter" });
  return result;
}

router.get("/", async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude))
    return res.status(400).send({ error: "Invalid geolocation data" });

  const start = {
    latitude,
    longitude,
  };

  const hotelsPromise = Hotel.find({ status: "approved" });
  const restaurantsPromise = Restaurant.find({ status: "approved" });
  const clubsPromise = Club.find({ status: "approved" });
  const barsPromise = Bar.find({ status: "approved" });

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
      const distance = await getDistance(start, end);
      return { ...item._doc, distance };
    })
  );

  const sortedItems = nearbyItems
    .filter((item) => item && item.distance <= 25000)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);

  res.send(sortedItems);

  try {
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't get nearby spots" });
  }
});

module.exports = router;

