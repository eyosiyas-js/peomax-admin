const Hotel = require("../models/Hotel");
const Restaurant = require("../models/Restaurant");
const Bar = require("../models/Bar");
const Club = require("../models/Club");

async function fetchAll(managerID) {
  if (managerID) {
    const query = {
      $or: [
        { supervisors: { $in: [managerID] } },
        { employees: { $in: [managerID] } },
        { managerID },
      ],
    };

    const [bars, clubs, hotels, restaurants] = await Promise.all([
      Bar.find(query),
      Club.find(query),
      Hotel.find(query),
      Restaurant.find(query),
    ]);

    const all = [...hotels, ...restaurants, ...clubs, ...bars];

    return all;
  } else {
    const [bars, clubs, hotels, restaurants] = await Promise.all([
      Bar.find({}),
      Club.find({}),
      Hotel.find({}),
      Restaurant.find({}),
    ]);

    const all = [...hotels, ...restaurants, ...clubs, ...bars];

    return all;
  }
}

module.exports = fetchAll;
