const Hotel = require("../models/Hotel");
const Restaurant = require("../models/Restaurant");
const Bar = require("../models/Bar");
const Club = require("../models/Club");

async function extractMain(managerID) {
  const bars = await Bar.find({ managerID, subHotel: false });
  const clubs = await Club.find({ managerID, subHotel: false });
  const hotels = await Hotel.find({ managerID });
  const restaurants = await Restaurant.find({ managerID, subHotel: false });

  const all = [...bars, ...clubs, ...hotels, ...restaurants];

  return all;
}

module.exports = extractMain;
