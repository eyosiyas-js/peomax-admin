const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  ID: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  menuID: {
    type: String,
    required: true,
  },
  items: [
    {
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      group: {
        type: String,
        required: true,
      },
      price: {
        type: String,
        required: true,
      },
      fasting: {
        type: Boolean,
        default: false,
      },
      itemID: {
        type: String,
        required: true,
      },
    },
  ],
});

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;
