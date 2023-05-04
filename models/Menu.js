const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
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
  ingredients: {
    type: Array,
    default: [],
  },
  fasting: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    required: true,
  },
  menuID: {
    type: String,
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const menuSchema = new mongoose.Schema({
  restaurantID: {
    type: String,
    required: true,
  },
  meals: [mealSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;
