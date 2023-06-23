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
    expires: "60d",
  },
});

const Token = mongoose.model("Token", tokenSchema);
module.exports = Token;
