const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");
const findPlace = require("../utils/findPlace");
const checkAuthorization = require("../utils/checkAuthorization");
const reserveMail = require("../utils/reserveMail");
const employeeChecker = require("../middleware/employeeChecker");

router.get("/:id/", employeeChecker, async (req, res) => {
  try {
    const { ID, category } = req.body;
    const place = await findPlace(ID, category);

    if (!place) return res.status(400).send({ error: `${category} not found` });

    const isAuthorized = checkAuthorization(req.user.userID, place);
    if (!isAuthorized)
      return res.status(401).send({ error: "Unauthorized action" });

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

router.post("/accept", employeeChecker, async (req, res) => {
  try {
    const { reservationID, ID, category } = req.body;
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

    reservation.status = "accepted";
    await reservation.save();

    res.send({ message: "Reservation accepted" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't accept reservation" });
  }
});

router.post("/reject", employeeChecker, async (req, res) => {
  try {
    const { reservationID, ID, category } = req.body;
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

    reservation.status = "rejected";
    await reservation.save();

    res.send({ message: "Reservation rejected" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't reject reservation" });
  }
});

module.exports = router;
