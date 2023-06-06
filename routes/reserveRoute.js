const express = require("express");
const Reservation = require("../models/Reservation");
const Restaurant = require("../models/Restaurant");
const Hotel = require("../models/Hotel");
const Bar = require("../models/Bar");
const Club = require("../models/Club");
const reserveMail = require("../utils/reserveMail");
const userChecker = require("../middleware/userChecker");
const { uid } = require("uid");

const router = express.Router();

router.post("/", userChecker, async (req, res) => {
  try {
    const { ID, people, date, time } = req.body;

    const hotels = await Restaurant.find({});
    const restaurants = await Hotel.find({});
    const clubs = await Club.find({});
    const bars = await Bar.find({});

    const items = hotels.concat(restaurants, clubs, bars);

    const spot = await items.filter((item) => item.ID == ID);

    if (spot.length == 0) {
      return res.status(404).send({ error: `No place found with ID: ${ID}` });
    }

    if (parseInt(people) > spot[0].availableSpots) {
      return res.status(400).send({ error: `Insufficient spots` });
    }

    const reservation = new Reservation({
      ID: ID,
      userID: req.user.userID,
      category: spot[0].category,
      people: people,
      date: date,
      time: time,
      price: parseInt(spot[0].price) * parseInt(people),
      reservationID: uid(16),
    });

    spot[0].availableSpots =
      parseInt(spot[0].availableSpots) - parseInt(people);
    spot[0].totalBooks = parseInt(spot[0].totalBooks) + 1;

    await spot[0].save();

    await reservation.save();
    await reserveMail(req.user.firstName, req.user.email);

    res.send({ message: "Reservation Email sent" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't reserve a spot" });
  }
});

module.exports = router;
