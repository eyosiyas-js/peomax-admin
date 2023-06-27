const mongoose = require("mongoose");

const clubSchema = new mongoose.Schema({
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
    default: 1500,
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
  category: {
    type: String,
    default: "club",
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  ID: {
    type: String,
    require: true,
  },

  // Extra fields

  crossStreet: {
    type: String,
    require: true,
  },
  neighborhood: {
    type: String,
    require: true,
  },
  cuisines: {
    type: String,
    require: true,
  },
  diningStyle: {
    type: String,
    require: true,
  },
  dressCode: {
    type: String,
    require: true,
  },
  parkingDetails: {
    type: String,
    require: true,
  },
  publicTransit: {
    type: String,
    require: true,
  },
  paymentOptions: {
    type: Array,
    default: ["oncash"],
  },
  additional: {
    type: String,
    require: true,
  },
  phoneNumber: {
    type: String,
    require: true,
  },
  website: {
    type: String,
    require: true,
  },
  subHotel: {
    type: Boolean,
    default: false,
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

const Club = mongoose.model("Club", clubSchema);

module.exports = Club;
