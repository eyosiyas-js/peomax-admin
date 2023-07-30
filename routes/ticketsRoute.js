const express = require("express");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const employeeChecker = require("../middleware/employeeChecker");
const findPlace = require("../utils/findPlace.js");
const checkAuthorization = require("../utils/checkAuthorization.js");

const router = express.Router();

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
