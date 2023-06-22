const Restaurant = require("../models/Restaurant");
const Hotel = require("../models/Hotel");
const Bar = require("../models/Bar");
const Club = require("../models/Club");

async function findPlace(ID, category) {
  let place;
  switch (category) {
    case "hotel":
      place = await Hotel.findOne({ ID: ID });
      break;
    case "club":
      place = await Club.findOne({ ID: ID });
      break;
    case "bar":
      place = await Bar.findOne({ ID: ID });
      break;
    case "restaurant":
      place = await Restaurant.findOne({ ID: ID });
      break;
    default:
      place = null;
  }
  return place;
}

module.exports = findPlace;
