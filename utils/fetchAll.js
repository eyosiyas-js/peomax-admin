const Hotel = require("../models/Hotel");
const Restaurant = require("../models/Restaurant");
const Bar = require("../models/Bar");
const Club = require("../models/Club");

async function fetchAll(managerID, role) {
  if (role) {
    const bars = await Bar.find({ [role]: { $in: [managerID] } });
    const clubs = await Club.find({ [role]: { $in: [managerID] } });
    const hotels = await Hotel.find({ [role]: { $in: [managerID] } });
    const restaurants = await Restaurant.find({ [role]: { $in: [managerID] } });

    const all = [...bars, ...clubs, ...hotels, ...restaurants];

    return all;
  } else {
    const bars = await Bar.find({ managerID });
    const clubs = await Club.find({ managerID });
    const hotels = await Hotel.find({ managerID });
    const restaurants = await Restaurant.find({ managerID });

    const all = [...bars, ...clubs, ...hotels, ...restaurants];

    return all;
  }
}

module.exports = fetchAll;
