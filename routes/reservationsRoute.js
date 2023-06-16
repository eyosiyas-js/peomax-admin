const express = require("express");
const Reservation = require("../models/Reservation");
const reserveMail = require("../utils/reserveMail");
const managerChecker = require("../middleware/managerChecker");
const { uid } = require("uid");

const router = express.Router();

router.get("/", managerChecker, async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;
    const reservationsCount = await Reservation.countDocuments({
      ID: req.params.id,
    });
    const totalPages = Math.ceil(reservationsCount / count);
    const reservations = await Reservation.find({ managerID: req.params.id })
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

router.post("/:id/accept", managerChecker, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ ID: req.params.id });
    if (!reservation)
      return res
        .status(404)
        .send({ error: `No reservation with ID: ${req.params.id}` });

    if (req.user.userID !== reservation.managerID)
      return res.status(400).send({ error: "Access denied" });

    reservation.status = "accepted";

    await reservation.save();
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't accept reservation" });
  }
});

router.post("/:id/reject", managerChecker, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ ID: req.params.id });
    if (!reservation)
      return res
        .status(404)
        .send({ error: `No reservation with ID: ${req.params.id}` });

    if (req.user.userID !== reservation.managerID)
      return res.status(400).send({ error: "Access denied" });

    reservation.status = "rejected";

    await reservation.save();
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't reject reservation" });
  }
});

module.exports = router;
