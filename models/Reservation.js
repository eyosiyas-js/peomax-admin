const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  ID: {
    type: String,
    required: true,
  },
  userID: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
  },
  category: {
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
  time: {
    type: String,
    required: true,
    trim: true,
  },
  // price: {
  //   type: Number,
  //   required: true,
  // },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "attended"],
    default: "pending",
  },
  expired: {
    type: Boolean,
    default: false,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  reservationID: {
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
