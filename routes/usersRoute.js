const express = require("express");
const User = require("../models/User.js");
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

router.get("/search", adminChecker, async (req, res) => {
  try {
    const regex = new RegExp(req.query.q, "i");

    const users = await User.find({
      $and: [
        {
          $or: [
            { email: { $regex: regex } },
            { firstName: { $regex: regex } },
            { lastName: { $regex: regex } },
            { name: { $regex: regex } },
            { userID: req.query.q },
          ],
        },
      ],
    });

    res.send(users);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting users" });
  }
});

router.delete("/:id/ban", adminChecker, async (req, res) => {
  try {
    const user = await User.findOne({ userID: req.params.id });

    if (!user) return res.status(403).send({ error: "User not found" });

    if (user.isBanned)
      return res.status(400).send({ error: "User already banned" });

    user.isBanned = true;

    await user.save();

    res.send({ message: `User Banned` });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Couldn't ban user" });
  }
});

module.exports = router;
