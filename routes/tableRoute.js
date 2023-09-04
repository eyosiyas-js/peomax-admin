const express = require("express");
const router = express.Router();
const ExcelJS = require("exceljs");
const User = require("../models/User");
const Reservation = require("../models/Reservation.js");
const Ticket = require("../models/Ticket.js");
const adminChecker = require("../middleware/adminChecker.js");
const fetchAll = require("../utils/fetchAll.js");

router.get("/tickets/:id/:place", adminChecker, async (req, res) => {
  try {
    let matchQuery = {};

    if (req.params.place && req.params.place !== "all") {
      matchQuery.ID = req.params.place;
    } else {
    }

    if (req.params.id === "premium") {
      matchQuery.isPremium = true;
    } else if (req.params.id === "regular") {
      matchQuery.isPremium = !true;
    } else if (req.params.id === "all") {
    } else {
      return res.status(400).send({ error: "Invalid type" });
    }

    const data = await Ticket.aggregate([{ $match: matchQuery }]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    worksheet.addRow([
      "Name",
      "Email",
      "Phone",
      "Event",
      "People",
      "Premium",
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
        customer.isPremium ? "Yes" : "No",
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

router.get("/reservations/:id/:place", adminChecker, async (req, res) => {
  try {
    let matchQuery = {};

    if (req.params.place && req.params.place !== "all") {
      matchQuery.ID = req.params.place;
    } else {
    }

    if (req.params.id !== "all") {
      matchQuery.status = req.params.id;
    }

    const data = await Reservation.aggregate([{ $match: matchQuery }]);

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

router.get("/users/:role", adminChecker, async (req, res) => {
  try {
    const { start, end } = req.query;
    let data;

    if (req.params.role === "all") {
      data = await User.find({});
      data = data.sort((a, b) => a.credits - b.credits);
    } else {
      data = await User.find({ role: req.params.role });
      data = data.sort((a, b) => a.credits - b.credits);
    }

    if (start && end) {
      if (isNaN(parseInt(start)) || parseInt(start) < 1 || isNaN(parseInt(end)))
        return res.status(400).send({ error: "Invalid numbers" });

      data = data.filter(
        (item) => item.credits <= end && item.credits >= start
      );
      data = data.sort((a, b) => a.credits - b.credits);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    worksheet.addRow([
      "Name",
      "Email",
      "reference",
      "Banned",
      "Credits",
      "role",
      "User ID",
    ]);

    data.forEach((customer) => {
      worksheet.addRow([
        customer.name
          ? customer.name
          : customer.firstName + " " + customer.lastName,
        customer.email,
        customer.reference,
        customer.isBanned == true ? "Yes" : "No",
        customer.credits,
        customer.role,
        customer.userID,
      ]);
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", "attachment; filename=users.xlsx");
      res.send(buffer);
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Could not get overview" });
  }
});

router.get("/:category/", adminChecker, async (req, res) => {
  try {
    const { start, end } = req.query;
    let data = await fetchAll();

    if (req.params.category !== "all") {
      data = data.filter((item) => item.category == req.params.category);
    }

    if (start && end) {
      if (isNaN(parseInt(start)) || parseInt(start) < 1 || isNaN(parseInt(end)))
        return res.status(400).send({ error: "Invalid numbers" });

      data = data.filter((item) => item._rank <= end && item._rank >= start);
      data = data.sort((a, b) => a._rank - b._rank);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    worksheet.addRow([
      "Name",
      "Description",
      "category",
      "Location",
      "Rating",
      "Featured",
      "Total Spots",
      "Rank",
      "Phone Number",
      "Website",
      "Status",
    ]);

    data.forEach((customer) => {
      worksheet.addRow([
        customer.name,
        customer.description,
        customer.category,
        customer.location,
        customer.rating,
        customer.isPremium.toString(),
        customer.totalSpots,
        customer._rank,
        customer.phoneNumber,
        customer.website,
        customer.status,
      ]);
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=companies.xlsx"
      );
      res.send(buffer);
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Could not get overview" });
  }
});

module.exports = router;
