const express = require("express");
const Event = require("../models/Event");
const User = require("../models/User");
const Ticket = require("../models/Ticket");
const Reservation = require("../models/Reservation");
const employeeChecker = require("../middleware/employeeChecker");
const userChecker = require("../middleware/userChecker");
const qrCode = require("../utils/qrCode");
const { uid } = require("uid");
const { validateTicket } = require("../utils/validator.js");
const findPlace = require("../utils/findPlace.js");
const checkAuthorization = require("../utils/checkAuthorization.js");
const { hasDatePassed } = require("../utils/hasPassed.js");

const router = express.Router();

router.post("/", userChecker, async (req, res) => {
  try {
    const valid = validateTicket(req.body);

    if (!valid.success) return res.status(400).send({ error: valid.message });

    const { eventID, isPremium, people, phoneNumber } = req.body;

    const event = await Event.findOne({ eventID: eventID });
    if (!event)
      return res
        .status(404)
        .send({ error: `No event found with id: ${eventID}` });

    if (hasDatePassed(event.date))
      return res.status(400).send({ error: "Event is over" });

    if (people > event.availableSpots)
      return res.status(400).send({ error: "Insufficient space" });

    let price = 0;

    if (isPremium) {
      price = parseInt(people) * parseFloat(event.premiumPrice);
    } else {
      price = parseInt(people) * parseFloat(event.price);
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).send({ error: "Invalid ticket price" });
    }

    const ticket = new Ticket({
      userID: req.user.userID,
      people: parseInt(people),
      date: event.date,
      time: event.eventStart,
      isPremium: isPremium == true ? true : false,
      price: price,
      phoneNumber,
      eventID: eventID,
      ticketID: uid(16),
    });

    event.availableSpots = event.availableSpots - parseInt(people);
    event.totalBooks = parseInt(event.totalBooks) + 1;
    await event.save();

    await ticket.save();

    await qrCode(
      ticket.ticketID,
      req.user.firstName,
      req.user.email,
      ticket.toObject(),
      event.toObject()
    );

    if (event.type) {
      const user = await User.findOne({ userID: req.user.userID });
      const reservation = new Reservation({
        ID: event.ID,
        userID: user.userID,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber,
        category: event.category,
        people,
        date: event.date,
        time: event.eventStart,
        reservationID: uid(16),
      });

      await reservation.save();

      req.io.emit(`reserve:${reservation.ID}`, reservation);
    }

    res.send({ message: "Virtual Ticket is sent to your email" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't book a ticket" });
  }
});

router.post("/verify/:id", employeeChecker, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketID: req.params.id });
    const event = await Event.findOne({ eventID: ticket.eventID });

    const place = await findPlace(event.ID, event.category);
    if (!place)
      return res
        .status(400)
        .send({ error: `No ${event.category} with ID: ${event.ID}` });

    const isAuthorized = await checkAuthorization(req.user.userID, place);
    if (!isAuthorized)
      return res.status(403).send({ error: "Unauthorized action" });

    if (!ticket)
      return res.status(404).send({ error: "Invalid virtual ticket" });
    if (ticket.expired || ticket.attended)
      return res.status(404).send({ error: "Ticket expired" });

    ticket.expired = true;
    ticket.attended = true;

    await ticket.save();

    res.send({ message: "Ticket verified!" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't book a ticket" });
  }
});

module.exports = router;
