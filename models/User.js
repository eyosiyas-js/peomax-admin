const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: false,
    trim: true,
  },
  lastName: {
    type: String,
    required: false,
    trim: true,
  },
  name: {
    type: String,
    required: false,
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
    required: false,
  },
  role: {
    type: String,
    enum: ["admin", "client", "manager", "supervisor", "employee"],
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
  reference: {
    type: String,
    require: false,
  },
  credits: {
    type: Number,
    require: true,
  },
  isBanned: {
    type: Boolean,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
