const express = require("express");
const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const managerChecker = require("../middleware/managerChecker.js");
const findPlace = require("../utils/findPlace.js");

const { validateEmployee } = require("../utils/validator.js");
const { uid } = require("uid");

require("dotenv").config();

const router = express.Router();

router.post("/register", managerChecker, async (req, res) => {
  try {
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase();
    }
    const valid = await validateEmployee(req.body);
    if (!valid.success) return res.status(400).send({ error: valid.message });

    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      ID,
      category,
    } = req.body;

    const existingUser = await User.findOne({ email: email });

    if (existingUser)
      return res.status(400).send({ error: "Account already exists" });
    if (password !== confirmPassword)
      return res.status(400).send({ error: "Passwords do not match" });

    const saltRounds = parseInt(process.env.saltRounds);
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      firstName,
      lastName,
      userID: uid(16),
      email,
      password: hashedPassword,
      role: "employee",
      verified: true,
    };

    const place = await findPlace(ID, category);
    if (!place)
      return res.status(404).send({ error: `No ${category} with ID: ${ID}` });

    const isAuthorized = req.user.userID == place.managerID;
    if (!isAuthorized)
      return res.status(403).send({ error: "Unauthorized action" });

    place.employees.push(userData.userID);
    await place.save();

    const user = new User(userData);
    await user.save();

    res.send({ message: "Account created", userData });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error creating Account" });
  }
});

module.exports = router;
