const express = require("express");
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const reserveMail = require("../utils/reserveMail");
const acceptMail = require("../utils/acceptMail");
const userChecker = require("../middleware/userChecker");
const employeeChecker = require("../middleware/employeeChecker");
const { uid } = require("uid");
const {
  validateReservation,
  validateReservationManual,
} = require("../utils/validator");
const findPlace = require("../utils/findPlace");
const checkAuthorization = require("../utils/checkAuthorization");
const {
  hasDatePassed,
  hasTimePassed,
  isTimeAfter,
} = require("../utils/hasPassed");
const availableSpots = require("../utils/availableSpots");

const router = express.Router();

router.post("/", userChecker, async (req, res) => {
  try {
    const valid = await validateReservation(req.body);
    if (!valid.success) return res.status(400).send({ error: valid.message });

    const { ID, category, people, date, time, phoneNumber } = req.body;

    const place = await findPlace(ID, category);
    if (!place) return res.status(404).send({ error: `${category} not found` });

    if (parseInt(people) > 10)
      return res.status(400).send({ error: "Maximum people allowed is 10" });

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

    const spots = await availableSpots(date, place);

    if (parseInt(people) > spots) {
      return res.status(400).send({ error: `Insufficient spots` });
    }

    const user = await User.findOne({ userID: req.user.userID });

    if (!user) return res.status(400).send({ error: "User not found" });
    const { firstName, lastName, email } = user;

    const reservation = new Reservation({
      ID: ID,
      name: place.name,
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

    user.phoneNumber = phoneNumber;
    user.credits = user.credits + 100;
    await user.save();

    res.send({ message: "Reservation Email sent" });
    req.io.emit(`reserve:${reservation.ID}`, reservation);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't reserve a spot" });
  }
});

router.post("/manual", employeeChecker, async (req, res) => {
  try {
    const valid = await validateReservationManual(req.body);
    if (!valid.success) return res.status(400).send({ error: valid.message });

    const {
      ID,
      category,
      people,
      date,
      time,
      firstName,
      lastName,
      email,
      phoneNumber,
    } = req.body;

    const place = await findPlace(ID, category);
    if (!place) return res.status(404).send({ error: `${category} not found` });

    const isAuthorized = checkAuthorization(req.user.userID, place);
    if (!isAuthorized)
      return res.status(403).send({ error: "Unauthorized action" });

    if (hasDatePassed(date))
      return res.status(400).send({ error: "Invalid date" });

    if (isTimeAfter(time, place.openingTime))
      return res
        .status(400)
        .send({ error: `${category} is not open at that time` });

    if (parseInt(people) > 10)
      return res.status(400).send({ error: "Maximum people allowed is 10" });

    if (hasTimePassed(time, place.closingTime))
      return res
        .status(400)
        .send({ error: `${category} is closed at this time` });

    if (parseInt(people) > place.availableSpots) {
      return res.status(400).send({ error: `Insufficient spots` });
    }

    const reservationData = {
      ID: ID,
      name: place.name,
      userID: `M-${uid(16)}`,
      firstName,
      lastName,
      phoneNumber,
      category: place.category,
      people: people,
      date: date,
      time: time,
      reservationID: uid(16),
      status: "accepted",
      manual: true,
    };

    if (email) {
      reservationData.email = email;
    }

    const reservation = new Reservation(reservationData);

    place.availableSpots = parseInt(place.availableSpots) - parseInt(people);
    place.totalBooks = parseInt(place.totalBooks) + 1;

    await place.save();

    await reservation.save();

    if (email) {
      const status = await acceptMail(
        firstName,
        email,
        ID,
        place,
        time,
        date,
        people
      );

      if (!status.success) {
        res.send({ message: status.message });
      } else {
        res.send({ message: "Reservation acceptance Email sent" });
      }
    } else {
      res.send({ message: "Reservation Successful" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't reserve a spot" });
  }
});

module.exports = router;
