const express = require("express");
const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const managerChecker = require("../middleware/managerChecker.js");
const fetchAll = require("../utils/fetchAll.js");

const { validateSupervisor } = require("../utils/validator.js");
const { uid } = require("uid");

require("dotenv").config();

const router = express.Router();

router.post("/register", managerChecker, async (req, res) => {
  try {
    const valid = await validateSupervisor(req.body);
    if (!valid.success) return res.status(400).send({ error: valid.message });

    const { firstName, lastName, email, password, confirmPassword } = req.body;

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
      role: "supervisor",
      verified: true,
    };

    const places = await fetchAll(req.user.userID);

    if (places == [])
      return res.status(404).send({ error: "No hotels/restaurants found" });

    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      place.supervisors.push(userData.userID);
      await place.save();
    }

    const user = new User(userData);
    await user.save();

    res.send({ message: "Account created", userData });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error creating Account" });
  }
});

module.exports = router;
