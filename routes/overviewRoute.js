const express = require("express");
const supervisorChecker = require("../middleware/superVisorChecker.js");
const Reservation = require("../models/Reservation.js");
const fetchAll = require("../utils/fetchAll.js");

const router = express.Router();

router.get("/", supervisorChecker, async (req, res) => {
  try {
    const all = await fetchAll(req.user.userID, [
      "supervisors",
      "employees",
      "category",
    ]);

    const statsPromises = [
      Reservation.aggregate([
        { $match: { ID: { $in: all.map((item) => item.ID) } } },
        {
          $group: {
            _id: "$ID",
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            accepted: {
              $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
            },
            attended: {
              $sum: { $cond: [{ $eq: ["$status", "attended"] }, 1, 0] },
            },
          },
        },
        {
          $group: {
            _id: null,
            reservations: { $sum: "$total" },
            pendingReservations: { $sum: "$pending" },
            acceptedReservations: { $sum: "$accepted" },
            rejectedReservations: { $sum: "$rejected" },
            attendedReservations: { $sum: "$attended" },
          },
        },
      ]),
      Promise.resolve(all.filter((item) => item.category !== "bars")),
      Promise.resolve(all.filter((item) => item.category !== "club")),
      Promise.resolve(all.filter((item) => item.category !== "hotel")),
      Promise.resolve(all.filter((item) => item.category !== "restaurant")),
    ];

    const [reservationStats, bars, clubs, hotels, restaurants] =
      await Promise.all(statsPromises);

    const {
      reservations,
      pendingReservations,
      acceptedReservations,
      rejectedReservations,
      attendedReservations,
    } = reservationStats[0];

    res.send({
      users: {
        total:
          all.reduce((count, item) => count + item.supervisors.length, 0) +
          all.reduce((count, item) => count + item.employees.length, 0),
        supervisors: all.reduce(
          (count, item) => count + item.supervisors.length,
          0
        ),
        employees: all.reduce(
          (count, item) => count + item.employees.length,
          0
        ),
      },
      reservations: {
        total: reservations || 0,
        pending: pendingReservations || 0,
        accepted: acceptedReservations || 0,
        rejected: rejectedReservations || 0,
        attended: attendedReservations || 0,
      },
      subHotels: {
        bars: bars.length,
        clubs: clubs.length,
        restaurants: restaurants.length,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Could not get overview" });
  }
});

module.exports = router;
