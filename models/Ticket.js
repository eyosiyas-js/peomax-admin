const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  people: {
    type: Number,
    default: 1,
  },
  date: {
    type: String,
    required: true,
  },
  bookedDate: {
    type: String,
    required: false,
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
  ID: {
    type: String,
    require: true,
  },
  category: {
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
