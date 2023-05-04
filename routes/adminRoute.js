const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User.js");
const Token = require("../models/Token.js");
const { validateLoginData } = require("../utils/validator.js");
const adminAuth = require("../middleware/adminChecker.js");
const router = express.Router();

const dotenv = require("dotenv");
dotenv.config();

router.post("/login", async (req, res) => {
  try {
    const { valid, errors } = await validateLoginData(req.body);

    if (!valid) return res.status(400).json(errors);

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

module.exports = router;
