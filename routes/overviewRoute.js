const express = require("express");
const supervisorChecker = require("../middleware/superVisorChecker.js");
const Reservation = require("../models/Reservation.js");
const Event = require("../models/Event.js");
const Ticket = require("../models/Ticket.js");
const fetchAll = require("../utils/fetchAll.js");

const router = express.Router();

function getReservationsByMonth(reservations) {
  const reservationsByMonth = Array(12).fill(0);
  reservations.forEach((reservation) => {
    const createdAt = new Date(reservation.createdAt);
    const month = createdAt.getUTCMonth();
    reservationsByMonth[month]++;
  });

  return reservationsByMonth;
}

router.get("/", supervisorChecker, async (req, res) => {
  try {
    const all = await fetchAll(req.user.userID);

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
          },
        },
        {
          $group: {
            _id: null,
            reservations: { $sum: "$total" },
            pendingReservations: { $sum: "$pending" },
            acceptedReservations: { $sum: "$accepted" },
            rejectedReservations: { $sum: "$rejected" },
          },
        },
      ]),
      Promise.resolve(all.filter((item) => item.category !== "bars")),
      Promise.resolve(all.filter((item) => item.category !== "club")),
      Promise.resolve(all.filter((item) => item.category !== "hotel")),
      Promise.resolve(all.filter((item) => item.category !== "restaurant")),
    ];

    const [reservationStats, bars, clubs, hotels, restaurants] =
      await Promise.all(statsPromises).catch((err) => {
        console.log(err);
        throw new Error("Could not fetch overview data");
      });

    const {
      reservations = 0,
      pendingReservations = 0,
      acceptedReservations = 0,
      rejectedReservations = 0,
    } = reservationStats[0] || {};

    const allReservations = await Reservation.aggregate([
      {
        $match: {
          ID: { $in: all.map((item) => item.ID) },
        },
      },
    ]);
    const reservationsPerMonth = getReservationsByMonth(allReservations);

    const events = await Event.aggregate([
      {
        $match: {
          ID: { $in: all.map((item) => item.ID) },
        },
      },
    ]);

    const tickets = await Ticket.aggregate([
      {
        $match: {
          eventID: { $in: events.map((event) => event.eventID) },
        },
      },
    ]);

    const attendedEvents = tickets.filter((ticket) => ticket.attended);

    const ticketsPerMonth = getReservationsByMonth(tickets);

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
        total: reservations,
        pending: pendingReservations,
        accepted: acceptedReservations,
        rejected: rejectedReservations,
        perMonth: reservationsPerMonth,
      },
      events: {
        total: events.length,
        tickets: tickets.length,
        attended: attendedEvents.length,
        perMonth: ticketsPerMonth,
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
