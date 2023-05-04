const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Token = mongoose.model("Token", tokenSchema);
module.exports = Token;
