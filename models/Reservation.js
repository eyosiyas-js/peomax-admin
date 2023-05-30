const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  spots: {
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
  type: {
    type: String,
    enum: ["regular", "event"],
    default: "regular",
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
