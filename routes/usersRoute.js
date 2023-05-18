const express = require("express");
const Order = require("../models/Reservation.js");
const User = require("../models/User.js");
const userChecker = require("../middleware/userChecker.js");
const adminChecker = require("../middleware/adminChecker.js");

const router = express.Router();

router.get("/", adminChecker, async (req, res) => {
  try {
    const users = await User.find({ role: "client" }, { password: 0 });
    res.send(users.map((user) => user.toObject()));
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting users" });
  }
});

router.get("/:id", adminChecker, async (req, res) => {
  try {
    const user = await User.findOne({ userID: req.params.id }, { password: 0 });
    res.send(user.toObject());
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting user" });
  }
});

router.get("/total", adminChecker, async (req, res) => {
  try {
    const count = await User.countDocuments({});
    console.log({ count });
    res.send({ count });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting users" });
  }
});

module.exports = router;
