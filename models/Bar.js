const mongoose = require("mongoose");

const barSchema = new mongoose.Schema({
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
  category: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  branches: {
    type: Array,
    default: [],
  },
  image: {
    type: String,
    required: true,
    trim: true,
  },
  images: {
    type: Array,
    default: [],
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  tables: {
    type: Number,
    required: false,
  },
  availableSpots: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalSpots: {
    type: Number,
    default: 0,
    min: 0,
  },
  openingTime: {
    type: String,
    required: true,
  },
  closingTime: {
    type: String,
    required: true,
  },
  numReviews: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalBooks: {
    type: Number,
    default: 0,
    min: 0,
  },
  barID: {
    type: String,
    require: true,
  },
  managerID: {
    type: String,
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Bar = mongoose.model("Bar", barSchema);

module.exports = Bar;
