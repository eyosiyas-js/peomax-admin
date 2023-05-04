const express = require("express");
const Order = require("../models/Reservation.js");
const User = require("../models/User.js");
const userChecker = require("../middleware/userChecker.js");
const adminChecker = require("../middleware/adminChecker.js");

const router = express.Router();

router.get("/profile", userChecker, async (req, res) => {
  try {
    const user = await User.findOne(
      { userID: req.user.userID },
      { password: 0, resetPasswordCode: 0, resetPasswordExpires: 0 }
    );
    res.send(user.toObject());
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting user" });
  }
});

router.get("/find/:id", adminChecker, async (req, res) => {
  try {
    const user = await User.findOne(
      { userID: req.params.id },
      { password: 0, resetPasswordCode: 0, resetPasswordExpires: 0 }
    );
    res.send(user.toObject());
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting user" });
  }
});

router.get("/all", adminChecker, async (req, res) => {
  try {
    const users = await User.find(
      {},
      { password: 0, resetPasswordCode: 0, resetPasswordExpires: 0 }
    );
    res.send(users.map((user) => user.toObject()));
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting users" });
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

router.get("/order", userChecker, async (req, res) => {
  try {
    const orders = await Order.find({
      userID: req.user.userID,
      status: { $nin: ["cancelled", "delivered"] },
    });

    if (!orders) return res.status(404).send({ error: "Orders not found." });

    return res.send(orders);
  } catch (error) {
    res.status(500).send({ error: "Error finding order." });
  }
});

router.get("/order-history", userChecker, async (req, res) => {
  try {
    const orders = await Order.find({
      userID: req.user.userID,
      status: { $nin: ["pending", "onway", "confirmed"] },
    });

    if (!orders) return res.status(404).send({ error: "Orders not found." });

    return res.send(orders);
  } catch (error) {
    res.status(500).send({ error: "Error finding order." });
  }
});

router.get("/delivery/all", adminChecker, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const deliveryCount = await User.countDocuments({ role: "delivery" });
    const deliveries = await User.find(
      { role: "delivery" },
      { password: 0, resetPasswordCode: 0, resetPasswordExpires: 0 }
    )
      .sort({ firstName: 1 })
      .skip(startIndex)
      .limit(limit);

    const results = {
      page: page,
      limit: limit,
      totalPages: Math.ceil(deliveryCount / limit),
      totalDeliveries: deliveryCount,
      deliveries: deliveries,
    };

    res.send(results);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Error getting delivery clients" });
  }
});

router.post("/update", userChecker, async (req, res) => {
  try {
    const user = await User.findOne({ userID: req.user.userID });
    const { firstName, lastName, email, phoneNumber, address } = req.body;
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.phoneNumber = phoneNumber;
    user.address = address;

    await user.save();

    res.send(user.toObject());
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Couldn't update user data" });
  }
});

module.exports = router;
