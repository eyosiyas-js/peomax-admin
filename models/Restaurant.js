const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
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
  location: {
    type: String,
    required: true,
    trim: true,
  },
  geoLocation: {
    latitude: {
      type: Number,
      required: false,
    },
    longitude: {
      type: Number,
      required: false,
    },
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
    required: false,
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
    default: "restaurant",
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  rank: {
    type: Number,
    unique: true,
    required: true,
    min: 1,
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
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "deleted"],
    default: "pending",
  },

  managerID: {
    type: String,
    require: true,
  },
  supervisors: {
    type: Array,
    default: [],
  },
  employees: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
