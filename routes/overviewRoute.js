const express = require("express");
const ExcelJS = require("exceljs");
const employeeChecker = require("../middleware/employeeChecker");
const Reservation = require("../models/Reservation.js");
const Event = require("../models/Event.js");
const Ticket = require("../models/Ticket.js");
const fetchAll = require("../utils/fetchAll.js");

const router = express.Router();

function getReservationsByMonth(reservations) {
  const reservationsByMonth = Array(12).fill(0);
  reservations.forEach((reservation) => {
    const date = reservation.date;
    const month = parseInt(date.substring(0, 2));
    if (month >= 1 && month <= 12) {
      reservationsByMonth[month - 1]++;
    }
  });

  return reservationsByMonth;
}

router.get("/", employeeChecker, async (req, res) => {
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
      await Promise.all(statsPromises).catch((err) => {
        console.log(err);
        throw new Error("Could not fetch overview data");
      });

    const {
      reservations = 0,
      pendingReservations = 0,
      acceptedReservations = 0,
      rejectedReservations = 0,
      attendedReservations = 0,
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
        total: (() => {
          const supervisorsSet = new Set();
          const employeesSet = new Set();

          all.forEach((item) => {
            item.supervisors.forEach((supervisor) =>
              supervisorsSet.add(supervisor)
            );
            item.employees.forEach((employee) => employeesSet.add(employee));
          });

          const totalSupervisors = supervisorsSet.size;
          const totalEmployees = employeesSet.size;

          return totalSupervisors + totalEmployees;
        })(),
        supervisors: (() => {
          const supervisorsSet = new Set();

          all.forEach((item) => {
            item.supervisors.forEach((supervisor) =>
              supervisorsSet.add(supervisor)
            );
          });

          return supervisorsSet.size;
        })(),
        employees: (() => {
          const employeesSet = new Set();

          all.forEach((item) => {
            item.employees.forEach((employee) => employeesSet.add(employee));
          });

          return employeesSet.size;
        })(),
      },
      reservations: {
        total: reservations,
        pending: pendingReservations,
        accepted: acceptedReservations,
        rejected: rejectedReservations,
        attended: attendedReservations,
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

router.get("/download/:id", employeeChecker, async (req, res) => {
  try {
    // const currentDate = new Date()
    //   .toLocaleDateString("en-US", {
    //     timeZone: "Africa/Addis_Ababa",
    //     month: "2-digit",
    //     day: "2-digit",
    //     year: "numeric",
    //   })
    //   .replace(/\//g, "/");

    if (!req.query.date)
      return res.status(400).send({ error: `date is required` });

    const all = await fetchAll(req.user.userID);
    let matchQuery = {
      ID: { $in: all.map((item) => item.ID) },
      date: req.query.date,
    };

    if (req.params.id !== "all") {
      matchQuery.status = req.params.id;
    }

    const data = await Reservation.aggregate([{ $match: matchQuery }]);
    if (data.length == 0)
      return res.status(400).send({ error: `No reservations on this date` });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    worksheet.addRow([
      "Name",
      "Email",
      "Phone",
      "Place",
      "People",
      "Date",
      "Time",
      "Status",
      "Reserved on",
      "Reservation ID",
    ]);

    data.forEach((customer) => {
      const createdAt = customer.time;
      const timestamp = customer.createdAt;
      const date = new Date(timestamp);

      const year = date.getUTCFullYear();
      const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
      const day = date.getUTCDate().toString().padStart(2, "0");

      const readableDate = `${month}/${day}/${year}`;

      worksheet.addRow([
        customer.firstName + " " + customer.lastName,
        customer.email,
        customer.phoneNumber,
        customer.name,
        customer.people,
        customer.date,
        customer.time,
        customer.status,
        readableDate,
        customer.reservationID,
      ]);
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=reservations.xlsx"
      );
      res.send(buffer);
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Could not get overview" });
  }
});

router.get("/tickets/download/:id", employeeChecker, async (req, res) => {
  try {
    const all = await fetchAll(req.user.userID);
    let matchQuery = {
      ID: { $in: all.map((item) => item.ID) },
    };

    if (req.params.id === "premium") {
      matchQuery.isPremium = true;
    } else if (req.params.id === "regular") {
      matchQuery.isPremium = false;
    } else if (req.params.id === "all") {
    } else {
      return res.status(400).send({ error: "Invalid type" });
    }

    const data = await Ticket.aggregate([{ $match: matchQuery }]);
    if (data.length == 0)
      return res.status(400).send({ error: `No reservations on this date` });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    worksheet.addRow([
      "Name",
      "Email",
      "Phone",
      "Event",
      "People",
      "Time",
      "Booked on",
      "ticket ID",
    ]);

    data.forEach((customer) => {
      worksheet.addRow([
        customer.firstName + " " + customer.lastName,
        customer.email,
        customer.phoneNumber,
        customer.name,
        customer.people,
        customer.time,
        customer.date,
        customer.ticketID,
      ]);
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", "attachment; filename=tickets.xlsx");
      res.send(buffer);
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Could not get overview" });
  }
});

module.exports = router;
