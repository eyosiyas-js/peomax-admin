const express = require("express");
const User = require("../models/User.js");
const userChecker = require("../middleware/userChecker.js");

const router = express.Router();

router.get("/", userChecker, async (req, res) => {
  try {
    if (!req.user.userID) return res.status(404).send({ error: "No user" });

    const user = await User.findOne(
      { userID: req.user.userID },
      { password: 0 }
    );
    res.send(user.toObject());
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting user" });
  }
});

router.put("/update", userChecker, async (req, res) => {
  try {
    if (!req.user.userID) return res.status(404).send({ error: "No user" });

    const user = await User.findOne(
      { userID: req.user.userID },
      { password: 0 }
    );
    const { firstName, lastName } = req.body;
    user.firstName = firstName;
    user.lastName = lastName;

    await user.save();

    res.send(user.toObject());
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Couldn't update user data" });
  }
});

module.exports = router;
