const express = require("express");
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const reserveMail = require("../utils/reserveMail");
const userChecker = require("../middleware/userChecker");
const { uid } = require("uid");
const { validateReservation } = require("../utils/validator");
const findPlace = require("../utils/findPlace");
const {
  hasDatePassed,
  hasTimePassed,
  isTimeAfter,
} = require("../utils/hasPassed");

const router = express.Router();

router.post("/", userChecker, async (req, res) => {
  try {
    const valid = await validateReservation(req.body);
    if (!valid.success) return res.status(400).send({ error: valid.message });

    const { ID, category, people, date, time, phoneNumber } = req.body;

    const place = await findPlace(ID, category);
    if (!place) return res.status(404).send({ error: `${category} not found` });

    if (hasDatePassed(date))
      return res.status(400).send({ error: "Invalid date" });

    if (isTimeAfter(time, place.openingTime))
      return res
        .status(400)
        .send({ error: `${category} is not open at that time` });

    if (hasTimePassed(time, place.closingTime))
      return res
        .status(400)
        .send({ error: `${category} is closed at this time` });

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
      phoneNumber,
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

    req.io.emit(`reserve:${reservation.ID}`, reservation);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't reserve a spot" });
  }
});

module.exports = router;
