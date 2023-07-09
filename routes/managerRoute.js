const express = require("express");
const User = require("../models/User.js");
const Reservation = require("../models/Reservation.js");
const Token = require("../models/Token.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const adminChecker = require("../middleware/adminChecker.js");
const supervisorChecker = require("../middleware/superVisorChecker.js");
const extractMain = require("../utils/extractMain.js");
const fetchAll = require("../utils/fetchAll.js");

const {
  validateManagerSignupData,
  validateLoginData,
} = require("../utils/validator.js");
const { uid } = require("uid");

require("dotenv").config();

const router = express.Router();

router.post("/register", adminChecker, async (req, res) => {
  try {
    const valid = await validateManagerSignupData(req.body);
    if (!valid.success) return res.status(400).send({ error: valid.message });

    const { name, password, confirmPassword, email } = req.body;

    const existingUser = await User.findOne({ email: email });

    if (existingUser)
      return res.status(400).send({ error: "Manager account already exists." });
    if (password !== confirmPassword)
      return res.status(400).send({ error: "Passwords do not match" });

    const saltRounds = parseInt(process.env.saltRounds);
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      userID: uid(16),
      name: name,
      password: hashedPassword,
      email: email,
      role: "manager",
      verified: true,
    };

    const user = new User(userData);

    await user.save();
    res.send({ message: "Account created", userData });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error creating Account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const valid = await validateLoginData(req.body);
    if (!valid.success) return res.status(400).send({ error: valid.message });

    const { email, password } = req.body;
    const user = await User.findOne({
      email: email,
      role: { $in: ["manager", "employee", "supervisor"] },
    });
    if (!user) return res.status(404).send({ error: "Account not found" });

    let userData = {};

    if (user.role == "manager") {
      userData = {
        name: user.name,
        password: user.password,
        email: user.email,
        userID: user.userID,
        role: user.role,
      };
    } else {
      userData = {
        firstName: user.firstName,
        lastName: user.lastName,
        password: user.password,
        email: user.email,
        userID: user.userID,
        role: user.role,
      };
    }

    const userPassword = user.password;
    const isMatch = await bcrypt.compare(password, userPassword);
    if (!isMatch) return res.status(400).send({ error: "password incorrect!" });

    const token1 = await jwt.sign(
      userData,
      process.env.access_token_secret_key,
      {
        expiresIn: "30d",
      }
    );

    const token2 = await jwt.sign(
      userData,
      process.env.refresh_token_secret_key,
      {
        expiresIn: "60d",
      }
    );

    const token = `Bearer ${token1}`;
    const refresh_token = `Bearer ${token2}`;

    const newRefreshToken = new Token({
      userID: userData.userID,
      token: refresh_token,
    });
    await newRefreshToken.save();

    delete userData.password;

    if (user.role == "employee") {
      const items = fetchAll(req.user.userID);

      if (items == []) return res.send({ token, refresh_token, userData });
      res.send({
        token,
        refresh_token,
        userData,
        ID: items[0].ID,
        category: items[0].category,
      });
    }

    const main = await extractMain(user.userID);
    if (!main) return res.send({ token, refresh_token, userData });

    res.send({
      token,
      refresh_token,
      userData,
      ID: main.ID,
      category: main.category,
    });
  } catch (error) {
    res.status(500).send({ error: "Could not login user." });
    console.log(error);
  }
});

router.get("/overview", supervisorChecker, async (req, res) => {
  try {
    const all = await fetchAll(req.user.userID);

    let totalUsers = 1;
    let supervisors = 0;
    let employees = 0;

    let totalReservations = 0;
    let pendingReservations = 0;
    let acceptedReservations = 0;
    let rejectedReservations = 0;
    let attendedReservations = 0;
    let cancelledReservations = 0;

    for (let i = 0; i < all.length; i++) {
      const item = all[i];
      supervisors = supervisors + item.supervisors.length;
      employees = supervisors + item.employees.length;
      totalUsers = totalUsers + supervisors + employees;

      totalReservations =
        totalReservations + (await Reservation.find({ ID: item.ID })).length;
      pendingReservations =
        pendingReservations +
        (await Reservation.find({ ID: item.ID, status: "pending" })).length;
      acceptedReservations =
        acceptedReservations +
        (await Reservation.find({ ID: item.ID, status: "accepted" })).length;
      rejectedReservations =
        rejectedReservations +
        (await Reservation.find({ ID: item.ID, status: "rejected" })).length;
      attendedReservations =
        attendedReservations +
        (await Reservation.find({ ID: item.ID, status: "attended" })).length;
    }

    const bars = await all.filter((item) => item.category !== "bars");
    const clubs = await all.filter((item) => item.category !== "club");
    const hotels = await all.filter((item) => item.category !== "hotel");
    const restaurants = await all.filter(
      (item) => item.category !== "restaurant"
    );

    res.send({
      users: {
        total: totalUsers,
        supervisors,
        employees,
      },
      reservations: {
        total: totalReservations,
        pending: pendingReservations,
        accepted: acceptedReservations,
        rejected: rejectedReservations,
        attended: attendedReservations,
      },
      subHotels: {
        bars: bars.length,
        clubs: clubs.length,
        restaurants: restaurants.length,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Could not get overview" });
  }
});

module.exports = router;
