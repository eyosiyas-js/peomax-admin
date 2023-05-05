const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "client"],
    default: "client",
  },
  profilePicture: {
    type: String,
    default: "none",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  userID: {
    type: String,
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
