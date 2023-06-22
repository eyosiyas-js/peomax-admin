const express = require("express");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const managerChecker = require("../middleware/managerChecker");
const userChecker = require("../middleware/userChecker");
const qrCode = require("../utils/qrCode");
const { uid } = require("uid");

const router = express.Router();

router.post("/", userChecker, async (req, res) => {
  try {
    const { eventID, isPremium, people } = req.body;

    if (!eventID) return res.status(400).send({ error: "eventID is required" });

    if (people)
      return res.status(400).send({ error: "No of people is required" });

    const event = await Event.findOne({ eventID: eventID });
    if (!event)
      return res
        .status(404)
        .send({ error: `No event found with id: ${eventID}` });

    if (people > event.availableSpots)
      return res.status(400).send({ error: "Insufficient space" });

    let price = 0;

    if (isPremium == true) {
      price = parseInt(people) * parseFloat(event.premiumPrice);
    } else {
      price = parseInt(people) * parseFloat(event.price);
    }

    const ticket = new Ticket({
      userID: req.user.userID,
      people: parseInt(people),
      date: event.date,
      time: event.eventStart,
      isPremium: isPremium == true ? true : false,
      price: price,
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

    res.send({ message: "Virtual Ticket is sent to your email" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't book a ticket" });
  }
});

router.post("/verify/:id", managerChecker, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketID: req.params.id });

    if (!ticket)
      return res.status(404).send({ error: "Invalid virtual ticket" });
    if (ticket.expired)
      return res.status(404).send({ error: "Ticket expired" });

    ticket.expired = true;

    await ticket.save();

    res.send({ message: "Ticket verified!" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't book a ticket" });
  }
});

module.exports = router;
