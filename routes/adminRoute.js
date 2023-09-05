const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User.js");
const Bar = require("../models/Bar");
const Club = require("../models/Club");
const Hotel = require("../models/Hotel");
const Restaurant = require("../models/Restaurant");
const Reservation = require("../models/Reservation.js");
const Ticket = require("../models/Ticket.js");
const Token = require("../models/Token.js");
const { validateLoginData } = require("../utils/validator.js");
const adminChecker = require("../middleware/adminChecker.js");
const findPlace = require("../utils/findPlace.js");
const fetchAll = require("../utils/fetchAll.js");
const router = express.Router();

const dotenv = require("dotenv");
dotenv.config();

router.post("/login", async (req, res) => {
  try {
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase();
    }

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

      if (!isMatch)
        return res.status(400).send({ error: "password incorrect!" });

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

router.delete("/delete", adminChecker, async (req, res) => {
  try {
    const { ID, category } = req.body;
    if (!ID || !category)
      return res.status(400).send({ error: "ID/category missing" });

    const place = await findPlace(ID, category);
    if (!place)
      return res.status(400).send({ error: `No ${category} with ID: ${ID}` });

    place.status = "deleted";
    await place.save();

    res.send({ message: `${category} deleted` });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Could not reject submission" });
  }
});

router.get("/totals", adminChecker, async (req, res) => {
  try {
    function getReservationsByMonth(reservations) {
      const reservationsByMonth = Array(12).fill(0);
      for (let i = 0; i < reservations.length; i++) {
        const reservation = reservations[i];
        const createdAt = new Date(reservation.createdAt);
        const month = createdAt.getUTCMonth();
        reservationsByMonth[month]++;
      }
      return reservationsByMonth;
    }

    const reservations = await Reservation.find({});
    const perMonth = getReservationsByMonth(reservations);

    res.send({
      users: {
        total: await User.countDocuments({}),
        banned: await User.countDocuments({ isBanned: true }),
        clients: await User.countDocuments({ role: "client" }),
        managers: await User.countDocuments({ role: "manager" }),
        supervisors: await User.countDocuments({ role: "supervisor" }),
        employees: await User.countDocuments({ role: "employee" }),
      },
      bars: {
        total: await Bar.countDocuments({}),
        pending: await Bar.countDocuments({ status: "pending" }),
        approved: await Bar.countDocuments({ status: "approved" }),
        rejected: await Bar.countDocuments({ status: "rejected" }),
      },
      clubs: {
        total: await Club.countDocuments({}),
        pending: await Club.countDocuments({ status: "pending" }),
        approved: await Club.countDocuments({ status: "approved" }),
        rejected: await Club.countDocuments({ status: "rejected" }),
      },
      hotels: {
        total: await Hotel.countDocuments({}),
        pending: await Hotel.countDocuments({ status: "pending" }),
        approved: await Hotel.countDocuments({ status: "approved" }),
        rejected: await Hotel.countDocuments({ status: "rejected" }),
      },
      restaurants: {
        total: await Restaurant.countDocuments({}),
        pending: await Restaurant.countDocuments({ status: "pending" }),
        approved: await Restaurant.countDocuments({ status: "approved" }),
        rejected: await Restaurant.countDocuments({ status: "rejected" }),
      },
      reservations: {
        total: await Reservation.countDocuments({}),
        pending: await Reservation.countDocuments({ status: "pending" }),
        accepted: await Reservation.countDocuments({ status: "accepted" }),
        rejected: await Reservation.countDocuments({ status: "rejected" }),
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

router.get("/reservations/:id", adminChecker, async (req, res) => {
  try {
    const ID = req.params.id;
    const count = parseInt(req.query.count) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;
    const reservationsCount = await Reservation.countDocuments({
      ID,
    });
    const totalPages = Math.ceil(reservationsCount / count);
    const reservations = await Reservation.find({ ID })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(count);

    res.send({
      page,
      totalPages,
      reservationsCount,
      reservations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting reservations" });
  }
});

router.get("/tickets/:id", adminChecker, async (req, res) => {
  try {
    const eventID = req.params.id;
    const count = parseInt(req.query.count) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;
    const ticketsCount = await Ticket.countDocuments({
      eventID,
    });
    const totalPages = Math.ceil(ticketsCount / count);
    const tickets = await Ticket.find({ eventID })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(count);

    res.send({
      page,
      totalPages,
      ticketsCount,
      tickets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting tickets" });
  }
});

router.post("/feature", adminChecker, async (req, res) => {
  try {
    const { ID, category } = req.query;

    if (!ID || !category)
      return res.status(400).send({ error: "ID/category is missing" });

    const place = await findPlace(ID, category);
    if (!place) return res.status(400).send({ error: `${category} not found` });

    if (place.isPremium)
      return res
        .status(400)
        .send({ error: `${place.name} is already set as premium` });

    place.isPremium = !place.isPremium;
    await place.save();

    res.send({
      message: `${place.name} is featured successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting reservations" });
  }
});

router.post("/rank", adminChecker, async (req, res) => {
  try {
    const { ID, category, rank } = req.body;

    if (!ID || !category || !rank)
      return res.status(400).send({ error: "ID/category/rank is missing" });

    if (isNaN(parseInt(rank)) || rank == 0) {
      return res.status(400).send({ error: "rank is invalid" });
    }

    const place = await findPlace(ID, category);
    if (!place) return res.status(400).send({ error: `${category} not found` });

    if (place._rank === rank)
      return res.status(400).send({ error: `Rank is already set to ${rank}` });

    const [bars, clubs, hotels, restaurants] = await Promise.all([
      Bar.find({}),
      Club.find({}),
      Hotel.find({}),
      Restaurant.find({}),
    ]);

    const all = [...hotels, ...restaurants, ...clubs, ...bars];
    const data = all.sort((a, b) => a._rank - b._rank);

    function findItemsBetweenRanksA(data, startRank, endRank) {
      const result = data.filter(
        (item) => item._rank > startRank && item._rank <= endRank
      );
      result.sort((a, b) => b._rank - a._rank);
      return result;
    }

    function findItemsBetweenRanksD(data, startRank, endRank) {
      const result = data.filter(
        (item) => item._rank < startRank && item._rank >= endRank
      );
      result.sort((a, b) => b._rank - a._rank);
      return result;
    }

    async function rankItem(rank, newRank) {
      const obj1 = data.find((res) => res._rank == rank);
      const obj2 = data.find((res) => res._rank == newRank);

      if (newRank - rank == 1) {
        obj1._rank = newRank;
        obj2._rank = rank;

        await obj1.save();
        await obj2.save();
      }

      if (rank - newRank == 1) {
        obj1._rank = newRank;
        obj2._rank = rank;

        await obj1.save();
        await obj2.save();
      }

      if (newRank - rank !== 1 && rank - newRank !== 1 && newRank < rank) {
        const middles = findItemsBetweenRanksD(data, rank, newRank);
        for (let i = 0; i < middles.length; i++) {
          const item = data[data.indexOf(middles[i])];

          item._rank = item._rank + 1;
          await item.save();
        }
      }

      if (newRank - rank !== 1 && rank - newRank !== 1 && newRank > rank) {
        const middles = findItemsBetweenRanksA(data, rank, newRank);

        for (let i = 0; i < middles.length; i++) {
          const item = data[data.indexOf(middles[i])];

          item._rank = item._rank - 1;
          await item.save();
        }
      }
    }

    await rankItem(place._rank, rank);
    place._rank = rank;
    await place.save();

    res.send({
      message: `${place.name} is ranked ${rank}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Could not perform action" });
  }
});

router.put("/change-password", adminChecker, async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword)
      return res
        .status(400)
        .send({ error: "password/confirm-password missing" });

    if (password !== confirmPassword)
      return res.status(400).send({ error: "passwords do not match" });

    const user = await User.findOne({
      userID: req.user.userID,
      role: "admin",
    });
    if (!user) return res.status(404).send({ error: "Account not found" });

    const saltRounds = parseInt(process.env.saltRounds);
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);

    user.password = hash;
    await user.save();

    res.send({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).send({ error: "Could change password" });
    console.log(error);
  }
});

router.post("/rate", adminChecker, async (req, res) => {
  try {
    const { ID, category, rate } = req.body;

    if (!ID || !category || !rate)
      return res.status(400).send({ error: "ID/category/rate is missing" });

    if (isNaN(parseInt(rate)) || parseInt(rate) < 0) {
      return res.status(400).send({ error: "rate is invalid" });
    }

    if (parseFloat(rate) > 5) {
      return res.status(400).send({ error: "maximum rate is 5" });
    }

    const place = await findPlace(ID, category);
    if (!place) return res.status(400).send({ error: `${category} not found` });

    place.rating = rate;
    await place.save();

    res.send({
      message: `${place.name} is rated ${rate}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting reservations" });
  }
});

router.get("/deleted", adminChecker, async (req, res) => {
  try {
    const [bars, clubs, hotels, restaurants] = await Promise.all([
      Bar.find({ status: "deleted" }),
      Club.find({ status: "deleted" }),
      Hotel.find({ status: "deleted" }),
      Restaurant.find({ status: "deleted" }),
    ]);

    const deleted = [...hotels, ...restaurants, ...clubs, ...bars];

    res.send(deleted);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Could not reject submission" });
  }
});

router.get("/rejected", adminChecker, async (req, res) => {
  try {
    const [bars, clubs, hotels, restaurants] = await Promise.all([
      Bar.find({ status: "rejected" }),
      Club.find({ status: "rejected" }),
      Hotel.find({ status: "rejected" }),
      Restaurant.find({ status: "rejected" }),
    ]);

    const rejected = [...hotels, ...restaurants, ...clubs, ...bars];

    res.send(rejected);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Could not reject submission" });
  }
});

module.exports = router;
