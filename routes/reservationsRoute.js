const express = require("express");
const Reservation = require("../models/Reservation");
const reserveMail = require("../utils/reserveMail");
const managerChecker = require("../middleware/managerChecker");
const { uid } = require("uid");

const router = express.Router();

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
