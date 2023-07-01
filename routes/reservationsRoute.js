const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const findPlace = require("../utils/findPlace");
const checkAuthorization = require("../utils/checkAuthorization");
const acceptMail = require("../utils/acceptMail");
const rejectMail = require("../utils/rejectMail");
const employeeChecker = require("../middleware/employeeChecker");

router.get("/", employeeChecker, async (req, res) => {
  try {
    const { ID, category } = req.query;

    if (!ID || !category)
      return res.status(400).send({ error: "ID/category is missing" });

    const place = await findPlace(ID, category);

    if (!place) return res.status(400).send({ error: `${category} not found` });

    const isAuthorized = checkAuthorization(req.user.userID, place);
    if (!isAuthorized)
      return res.status(401).send({ error: "Unauthorized access" });

    const count = parseInt(req.query.count) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;
    const reservationsCount = await Reservation.countDocuments({ ID: ID });
    const totalPages = Math.ceil(reservationsCount / count);
    const reservations = await Reservation.find({ ID: ID })
      .skip(skip)
      .limit(count);

    res.send({
      page,
      totalPages,
      reservationsCount,
      reservations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting reservations" });
  }
});

router.get("/:id", employeeChecker, async (req, res) => {
  try {
    const reservation_data = await Reservation.findOne({
      reservationID: req.params.id,
    });

    if (!reservation_data)
      return res
        .status(404)
        .send({ error: `No reservation with ID: ${req.params.id}` });

    const user = await User.findOne(
      { userID: reservation_data.userID },
      { password: 0 }
    );

    if (!user) return res.status(400).send({ error: "User not found" });

    const reservation = Object.assign(
      {},
      reservation_data.toObject(),
      user.toObject()
    );

    res.send(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting reservations" });
  }
});

router.post("/accept", employeeChecker, async (req, res) => {
  try {
    const { reservationID, ID, category } = req.body;

    if (!reservationID || !ID || !category)
      return res
        .status(400)
        .send({ error: "Please fill all the required info" });

    const place = await findPlace(ID, category);

    if (!place) return res.status(400).send({ error: `${category} not found` });

    const isAuthorized = checkAuthorization(req.user.userID, place);
    if (!isAuthorized)
      return res.status(401).send({ error: "Unauthorized action" });

    const reservation = await Reservation.findOne({
      reservationID: reservationID,
    });
    if (!reservation)
      return res
        .status(404)
        .send({ error: `No reservation with ID: ${reservationID}` });

    if (reservation.status == "rejected")
      return res.status(400).send({ error: "Reservation already rejected" });
    if (reservation.status == "accepted")
      return res.status(400).send({ error: "Reservation already accepted" });

    reservation.status = "accepted";
    await reservation.save();

    const user = await User.findOne({ userID: reservation.userID });
    acceptMail(user.firstName, user.email);

    res.send({ message: "Acceptance email sent" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't accept reservation" });
  }
});

router.post("/reject", employeeChecker, async (req, res) => {
  try {
    const { reservationID, ID, category } = req.body;

    if (!reservationID || !ID || !category)
      return res
        .status(400)
        .send({ error: "Please fill all the required info" });

    const place = await findPlace(ID, category);

    if (!place) return res.status(400).send({ error: `${category} not found` });

    const isAuthorized = checkAuthorization(req.user.userID, place);
    if (!isAuthorized)
      return res.status(401).send({ error: "Unauthorized action" });

    const reservation = await Reservation.findOne({
      reservationID: reservationID,
    });
    if (!reservation)
      return res
        .status(404)
        .send({ error: `No reservation with ID: ${reservationID}` });

    if (reservation.status == "accepted")
      return res.status(400).send({ error: "Reservation already accepted" });
    if (reservation.status == "rejected")
      return res.status(400).send({ error: "Reservation already rejected" });

    reservation.status = "rejected";
    await reservation.save();

    const user = await User.findOne({ userID: reservation.userID });
    rejectMail(user.firstName, user.email);

    res.send({ message: "Rejection email sent" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't reject reservation" });
  }
});

module.exports = router;
