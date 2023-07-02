const Hotel = require("../models/Hotel");
const Restaurant = require("../models/Restaurant");
const Bar = require("../models/Bar");
const Club = require("../models/Club");

async function fetchAll(managerID) {
  const bars = await Bar.find({ managerID });
  const clubs = await Club.find({ managerID });
  const hotels = await Hotel.find({ managerID });
  const restaurants = await Restaurant.find({ managerID });

  const all = [...bars, ...clubs, ...hotels, ...restaurants];

  return all;
}

module.exports = fetchAll;
