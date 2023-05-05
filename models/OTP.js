const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  userID: {
    type: String,
    require: true,
  },
  code: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["emailVerification", "resetPassword"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "5m",
  },
});

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;
