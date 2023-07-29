const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  people: {
    type: Number,
    default: 1,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  expired: {
    type: Boolean,
    default: false,
  },
  attended: {
    type: Boolean,
    default: false,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  program: {
    type: Boolean,
    default: false,
  },
  eventID: {
    type: String,
    require: true,
  },
  ticketID: {
    type: String,
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
