const Hotel = require("../models/Hotel");
const Restaurant = require("../models/Restaurant");
const Bar = require("../models/Bar");
const Club = require("../models/Club");

async function extractMain(managerID, role) {
  if (role) {
    const bars = await Bar.find({
      [role]: { $in: [managerID] },
      subHotel: { $ne: true },
    });
    const clubs = await Club.find({
      [role]: { $in: [managerID] },
      subHotel: { $ne: true },
    });
    const hotels = await Hotel.find({
      [role]: { $in: [managerID] },
      subHotel: { $ne: true },
    });
    const restaurants = await Restaurant.find({
      [role]: { $in: [managerID] },
      subHotel: { $ne: true },
    });

    const all = [...bars, ...clubs, ...hotels, ...restaurants];

    return all[0];
  }

  const bars = await Bar.find({ managerID, subHotel: false });
  const clubs = await Club.find({ managerID, subHotel: false });
  const hotels = await Hotel.find({ managerID });
  const restaurants = await Restaurant.find({ managerID, subHotel: false });

  const all = [...bars, ...clubs, ...hotels, ...restaurants];

  return all[0];
}

module.exports = extractMain;
