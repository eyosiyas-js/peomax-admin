const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  ID: {
    type: String,
    required: true,
  },
  availableSpots: {
    type: Number,
    default: 1,
  },
  totalSpots: {
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
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  managerID: {
    type: String,
    required: true,
  },
  eventID: {
    type: String,
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = Reservation;
