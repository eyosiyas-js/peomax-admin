const express = require("express");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const employeeChecker = require("../middleware/employeeChecker");
const findPlace = require("../utils/findPlace.js");
const fetchAll = require("../utils/fetchAll");
const checkAuthorization = require("../utils/checkAuthorization.js");

const router = express.Router();

router.get("/all", employeeChecker, async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 20;
    const page = parseInt(req.query.page) || 1;

    const all = await fetchAll(req.user.userID);

    const startIndex = (page - 1) * count;

    const matchQuery = { ID: { $in: all.map((item) => item.ID) } };
    if (
      req.query.status &&
      (req.query.status == "expired" || req.query.status == "attended")
    ) {
      matchQuery.status = req.query.status;
    }

    const matchStage = { $match: matchQuery };

    const sortStage = { $sort: { createdAt: -1 } };
    const skipStage = { $skip: startIndex };
    const limitStage = { $limit: count };

    const [reservations, totalCount] = await Promise.all([
      Ticket.aggregate([matchStage, sortStage, skipStage, limitStage]),
      Ticket.aggregate([matchStage, { $count: "totalCount" }]),
    ]);

    const totalPages = Math.ceil(totalCount[0]?.totalCount / count) || 1;

    res.send({
      page,
      totalPages,
      reservationsCount: totalCount[0]?.totalCount || 0,
      reservations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting reservations" });
  }
});

router.get("/:id", employeeChecker, async (req, res) => {
  try {
    const event = await Event.findOne({ eventID: req.params.id });

    const place = await findPlace(event.ID, event.category);
    if (!place)
      return res
        .status(400)
        .send({ error: `No ${event.category} with ID: ${event.ID}` });

    const isAuthorized = await checkAuthorization(req.user.userID, place);
    if (!isAuthorized)
      return res.status(403).send({ error: "Unauthorized action" });

    const tickets = await Ticket.find({ eventID: event.eventID });

    const count = parseInt(req.query.count) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;

    const totalPages = Math.ceil(tickets.length / count);
    const paginatedData = tickets.slice(skip, skip + count);

    res.send({
      page,
      totalPages,
      ticketsCount: tickets.length,
      tickets: paginatedData,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't book a ticket" });
  }
});

module.exports = router;
