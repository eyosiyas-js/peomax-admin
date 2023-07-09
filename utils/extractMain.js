const Hotel = require("../models/Hotel");
const Restaurant = require("../models/Restaurant");
const Bar = require("../models/Bar");
const Club = require("../models/Club");

async function extractMain(managerID) {
  const query = {
    $or: [
      { supervisors: { $in: [managerID] }, subHotel: false },
      { employees: { $in: [managerID] }, subHotel: false },
      { managerID, subHotel: false },
    ],
  };

  const [bars, clubs, hotels, restaurants] = await Promise.all([
    Bar.find(query),
    Club.find(query),
    Hotel.find(query),
    Restaurant.find(query),
  ]);

  const all = [...bars, ...clubs, ...hotels, ...restaurants];

  return all[0];
}

module.exports = extractMain;
