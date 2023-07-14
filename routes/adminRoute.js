const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User.js");
const Bar = require("../models/Hotel");
const Club = require("../models/Club");
const Hotel = require("../models/Hotel");
const Restaurant = require("../models/Restaurant");
const Reservation = require("../models/Reservation.js");
const Token = require("../models/Token.js");
const { validateLoginData } = require("../utils/validator.js");
const adminChecker = require("../middleware/adminChecker.js");
const findPlace = require("../utils/findPlace.js");
const router = express.Router();

const dotenv = require("dotenv");
dotenv.config();

router.post("/login", async (req, res) => {
  try {
    const valid = await validateLoginData(req.body);
    if (!valid.success) return res.status(400).send({ error: valid.message });

    const { email, password } = req.body;
    const user = await User.findOne({ email: email, role: "admin" });
    if (!user) {
      res.status(404).send({ error: "Admin not found." });
    } else {
      const userData = {
        password: user.password,
        email: user.email,
        userID: user.userID,
        role: "admin",
      };

      const userPassword = user.password;
      const isMatch = await bcrypt.compare(password, userPassword);

      if (!isMatch) res.status(400).send({ error: "password incorrect!" });

      delete userData.password;

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

      res.send({ token, refresh_token, userData });
    }
  } catch (error) {
    res.status(500).send("Could not login to admin");
    console.log(error);
  }
});

router.post("/approve", adminChecker, async (req, res) => {
  try {
    const { ID, category } = req.body;
    if (!ID || !category)
      return res.status(400).send({ error: "ID/category missing" });

    const place = await findPlace(ID, category);
    if (!place)
      return res.status(400).send({ error: `No ${category} with ID: ${ID}` });

    place.status = "approved";
    await place.save();

    res.send({ message: `${category} approved` });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Could not approve submission" });
  }
});

router.post("/reject", adminChecker, async (req, res) => {
  try {
    const { ID, category } = req.body;
    if (!ID || !category)
      return res.status(400).send({ error: "ID/category missing" });

    const place = await findPlace(ID, category);
    if (!place)
      return res.status(400).send({ error: `No ${category} with ID: ${ID}` });

    place.status = "rejected";
    await place.save();

    res.send({ message: `${category} rejected` });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Could not reject submission" });
  }
});

router.get("/totals", adminChecker, async (req, res) => {
  try {
    function getReservationsByMonth(reservations) {
      const reservationsByMonth = Array(12).fill(0);
      reservations.forEach((reservation) => {
        const createdAt = new Date(reservation.createdAt);
        const month = createdAt.getUTCMonth();
        reservationsByMonth[month]++;
      });

      return reservationsByMonth;
    }

    const [
      totalUsers,
      bannedUsers,
      clients,
      managers,
      supervisors,
      employees,
      totalBars,
      pendingBars,
      approvedBars,
      rejectedBars,
      totalClubs,
      pendingClubs,
      approvedClubs,
      rejectedClubs,
      totalHotels,
      pendingHotels,
      approvedHotels,
      rejectedHotels,
      totalRestaurants,
      pendingRestaurants,
      approvedRestaurants,
      rejectedRestaurants,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ role: "client" }),
      User.countDocuments({ role: "manager" }),
      User.countDocuments({ role: "supervisor" }),
      User.countDocuments({ role: "employee" }),
      Bar.countDocuments({}),
      Bar.countDocuments({ status: "pending" }),
      Bar.countDocuments({ status: "approved" }),
      Bar.countDocuments({ status: "rejected" }),
      Club.countDocuments({}),
      Club.countDocuments({ status: "pending" }),
      Club.countDocuments({ status: "approved" }),
      Club.countDocuments({ status: "rejected" }),
      Hotel.countDocuments({}),
      Hotel.countDocuments({ status: "pending" }),
      Hotel.countDocuments({ status: "approved" }),
      Hotel.countDocuments({ status: "rejected" }),
      Restaurant.countDocuments({}),
      Restaurant.countDocuments({ status: "pending" }),
      Restaurant.countDocuments({ status: "approved" }),
      Restaurant.countDocuments({ status: "rejected" }),
    ]);

    const reservations = await Reservation.find({});
    const perMonth = getReservationsByMonth(reservations);

    res.send({
      users: {
        total: totalUsers,
        banned: bannedUsers,
        clients,
        managers,
        supervisors,
        employees,
      },
      bars: {
        total: totalBars,
        pending: pendingBars,
        approved: approvedBars,
        rejected: rejectedBars,
      },
      clubs: {
        total: totalClubs,
        pending: pendingClubs,
        approved: approvedClubs,
        rejected: rejectedClubs,
      },
      hotels: {
        total: totalHotels,
        pending: pendingHotels,
        approved: approvedHotels,
        rejected: rejectedHotels,
      },
      restaurants: {
        total: totalRestaurants,
        pending: pendingRestaurants,
        approved: approvedRestaurants,
        rejected: rejectedRestaurants,
      },
      reservations: {
        total: reservations.length,
        pending: reservations.map(
          (reservation) => reservation.status == "pending"
        ).length,
        accepted: reservations.map(
          (reservation) => reservation.status == "accepted"
        ).length,
        rejected: reservations.map(
          (reservation) => reservation.status == "rejected"
        ).length,
        perMonth,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error getting total items" });
  }
});

router.get("/pending", adminChecker, async (req, res) => {
  try {
    const hotels = await Hotel.find({ status: "pending" });
    const restaurants = await Restaurant.find({ status: "pending" });
    const bars = await Bar.find({ status: "pending" });
    const clubs = await Club.find({ status: "pending" });
    const items = hotels.concat(restaurants, bars, clubs);

    const count = parseInt(req.query.count) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;
    const itemsCount = items.length;
    const totalPages = Math.ceil(itemsCount / count);

    const paginatedData = items.slice(skip, skip + count);

    res.send({
      page,
      totalPages,
      itemsCount,
      items: paginatedData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: `Error` });
  }
});

module.exports = router;
