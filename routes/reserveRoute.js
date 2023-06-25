const express = require("express");
const Reservation = require("../models/Reservation");
const Restaurant = require("../models/Restaurant");
const Hotel = require("../models/Hotel");
const Bar = require("../models/Bar");
const Club = require("../models/Club");
const User = require("../models/User");
const reserveMail = require("../utils/reserveMail");
const userChecker = require("../middleware/userChecker");
const { uid } = require("uid");

const router = express.Router();

router.post("/", userChecker, async (req, res) => {
  try {
    const { ID, category, people, date, time } = req.body;

    if (!people || !date || !time)
      return res.status(400).send({ error: "Please fill in all the forms" });

    if (!ID || !category)
      return res.status(400).send({ error: "ID / category missing" });

    let place;

    if (category == "hotel") {
      place = await Hotel.findOne({ ID: ID });

      if (!place) return res.status(400).send({ error: "Hotel not found" });
    } else if (category == "club") {
      place = await Club.findOne({ ID: ID });

      if (!place) return res.status(400).send({ error: "Club not found" });
    } else if (category == "bar") {
      place = await Bar.findOne({ ID: ID });

      if (!place) return res.status(400).send({ error: "Bar not found" });
    } else if (category == "restaurant") {
      place = await Restaurant.findOne({ ID: ID });

      if (!place)
        return res.status(400).send({ error: "Restaurant not found" });
    } else {
      return res.status(400).send({ error: "Invalid category" });
    }

    if (parseInt(people) > place.availableSpots) {
      return res.status(400).send({ error: `Insufficient spots` });
    }

    const user = await User.findOne({ userID: req.user.userID });

    if (!user) return res.status(400).send({ error: "User not found" });
    const { firstName, lastName, email } = user;

    const reservation = new Reservation({
      ID: ID,
      userID: req.user.userID,
      firstName,
      lastName,
      email,
      phoneNumber: "+251931528565",
      category: place.category,
      people: people,
      date: date,
      time: time,
      // price: parseInt(place.price) * parseInt(people),
      reservationID: uid(16),
    });

    place.availableSpots = parseInt(place.availableSpots) - parseInt(people);
    place.totalBooks = parseInt(place.totalBooks) + 1;

    await place.save();

    await reservation.save();
    await reserveMail(req.user.firstName, req.user.email);

    res.send({ message: "Reservation Email sent" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't reserve a spot" });
  }
});

module.exports = router;
