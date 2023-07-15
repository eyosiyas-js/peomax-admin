const express = require("express");
const User = require("../models/User.js");
const adminChecker = require("../middleware/adminChecker.js");
const managerChecker = require("../middleware/managerChecker.js");
const fetchAll = require("../utils/fetchAll.js");

const router = express.Router();

router.get("/", adminChecker, async (req, res) => {
  try {
    const users = await User.find({ role: "client" }, { password: 0 });
    if (users.length === 0)
      return res.status(400).send({ error: "Users not found" });

    res.send(users.map((user) => user.toObject()));
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting users" });
  }
});

router.get("/search", managerChecker, async (req, res) => {
  try {
    if (req.user.role == "admin") {
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
    } else {
      const all = await fetchAll(req.user.userID);
      const supervisors = all.map((item) => item.supervisors);
      const employees = all.map((item) => item.employees);

      const users = await User.aggregate([
        {
          $match: {
            userID: { $in: [...supervisors, ...employees] },
          },
        },
      ]);

      const searchResults = users.filter((user) => {
        return (
          user.email.match(regex) ||
          user.firstName.match(regex) ||
          user.lastName.match(regex) ||
          user.userID === req.query.q
        );
      });

      re.send(searchResults);
    }
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

router.delete("/:id/ban", managerChecker, async (req, res) => {
  try {
    if (req.user.role == "admin") {
      const user = await User.findOne({ userID: req.params.id });
      if (!user) return res.status(403).send({ error: "User not found" });

      if (user.isBanned)
        return res.status(400).send({ error: "User already banned" });
      user.isBanned = true;

      await user.save();

      res.send({ message: `User Banned` });
    } else {
      const all = await fetchAll(req.user.userID);
      const supervisors = all.map((item) => item.supervisors);
      const employees = all.map((item) => item.employees);

      const users = await User.aggregate([
        {
          $match: {
            userID: { $in: [...supervisors, ...employees] },
          },
        },
      ]);

      const user = users.filter((user) => user.userID === req.params.id);
      if (user.length === 0)
        return res.status(404).send({ error: "User not found" });

      user[0].isBanned = true;
      await user[0].save();

      res.send({ message: "User Banned" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Couldn't ban user" });
  }
});

module.exports = router;
