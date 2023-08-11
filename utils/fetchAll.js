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

    const all = [...bars, ...clubs, ...hotels, ...restaurants];

    return all;
  } else {
    const [bars, clubs, hotels, restaurants] = await Promise.all([
      Bar.find({ status: "approved" }),
      Club.find({ status: "approved" }),
      Hotel.find({ status: "approved" }),
      Restaurant.find({ status: "approved" }),
    ]);

    const all = [...bars, ...clubs, ...hotels, ...restaurants];

    return all;
  }
}

module.exports = fetchAll;
