const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
  },
  images: {
    type: Array,
    default: [],
  },
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
    min: 0,
  },
  totalSpots: {
    type: Number,
    default: 1,
    min: 1,
  },
  totalBooks: {
    type: Number,
    default: 0,
  },
  date: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
    required: false,
  },
  isFullDay: {
    type: Boolean,
    default: false,
  },
  eventStart: {
    type: String,
    required: true,
  },
  eventEnd: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  premiumPrice: {
    type: Number,
    required: false,
  },
  status: {
    type: String,
    enum: ["active", "deleted"],
    default: "active",
  },
  program: {
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

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
