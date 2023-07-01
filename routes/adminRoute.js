const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User.js");
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

module.exports = router;
