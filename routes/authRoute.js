const express = require("express");
const User = require("../models/User.js");
const Token = require("../models/Token.js");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { uid } = require("uid");
const {
  validateSignupData,
  validateLoginData,
} = require("../utils/validator.js");

require("dotenv").config();

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { valid, errors } = await validateSignupData(req.body);
    if (!valid) return res.status(400).json(errors);

    const { firstName, lastName, password, email, phoneNumber } = req.body;

    const existingUser = await User.findOne({ email: email });

    if (existingUser)
      return res.status(400).send({ error: "User already exists." });

    const saltRounds = parseInt(process.env.saltRounds);
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      firstName: firstName,
      lastName: lastName,
      password: hashedPassword,
      email: email,
      phoneNumber: phoneNumber,
      role: "client",
    };

    const user = new User(userData);

    await user.save();

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

    const newToken = new Token({ userID: userData.userID, token: token2 });
    await newToken.save();

    const token = `Bearer ${token1}`;
    const refresh_token = `Bearer ${token2}`;
    res.send({ token, refresh_token, userData });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error saving signup user." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { valid, errors } = await validateLoginData(req.body);

    if (!valid) return res.status(400).json(errors);

    const { email, password } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) return res.status(404).send({ error: "User not found." });

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      password: user.password,
      email: user.email,
      phoneNumber: user.phoneNumber,
      userID: user.userID,
      role: user.role,
    };

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

    res.send({ token, refresh_token, userData });
  } catch (error) {
    res.status(500).send({ error: "Could not loggin user." });
    console.log(error);
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const code = await crypto.randomInt(0, 1000000);
    const resetPasswordExpires = (await Date.now()) + 3600000;

    const { email } = req.body;
    const user = await User.findOneAndUpdate(
      { email: email },
      { resetPasswordCode: code, resetPasswordExpires: resetPasswordExpires }
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.email,
        pass: process.env.email_password,
      },
    });

    const mailOptions = {
      to: email,
      from: process.env.email,
      subject: "Password Reset Request",
      text: `Please type the following verification code into your browser inorder to change your password. \n\n
                            ${code} \n\n
          if you did not request to change your password, just ignore this message.
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).send({ error: "Couldn't send email" });
      } else {
        res.status(200).send({ message: "Password reset email sent" });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Couldn't change password" });
  }
});

router.post("/confirm-code/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const user = await User.findOne({ resetPasswordCode: code });

    if (!user)
      return res.status(400).send({ error: "Invalid or expired token" });

    const resetPasswordExpires = user.resetPasswordExpires;

    if (resetPasswordExpires < Date.now())
      return res.status(500).send({ error: "Verification code expired." });

    if (parseInt(code) !== user.resetPasswordCode)
      return res.status(500).send({ error: "Incorrect verification code." });

    res.send({ code });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Could not change password" });
  }
});

router.post("/change-password/:code", async (req, res) => {
  const { code } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({ resetPasswordCode: code });
    if (!user)
      return res.status(404).send({ error: "Code expired or invalid." });

    const saltRounds = parseInt(process.env.saltRounds);
    const salt = await bcrypt.genSalt(saltRounds);
    const newhashedPassword = await bcrypt.hash(newPassword, salt);

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      password: newhashedPassword,
      email: user.email,
      phoneNumber: user.phoneNumber,
      userID: user.userID,
      role: user.role,
    };

    await user.save();

    const jwttoken = await jwt.sign(
      userData,
      process.env.access_token_secret_key,
      {
        expiresIn: "30d",
      }
    );

    delete userData.password;

    const token = `Bearer ${jwttoken}`;
    res.send({ token, userData });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Couldn't change password" });
  }
});

router.get("/refresh-token", async (req, res) => {
  try {
    const refresh_token = await Token.findOne({
      token: req.body.refresh_token,
    });
    if (!refresh_token)
      return res.status(401).send({ error: "Inavliad/Expired refresh token" });
    const userData = await jwt.verify(
      req.body.refresh_token.slice(7),
      process.env.refresh_token_secret_key
    );

    delete userData.exp;

    const token = await jwt.sign(
      userData,
      process.env.access_token_secret_key,
      {
        expiresIn: "30d",
      }
    );

    res.send({ token, userData });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Couldn't refresh token" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const refresh_token = await Token.findOne({
      token: req.body.refresh_token,
    });
    if (!refresh_token)
      return res.status(401).send({ error: "Inavliad/Expired refresh token" });

    await refresh_token.remove();

    res.send({ message: "Logged out" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Couldn't refresh token" });
  }
});

module.exports = router;
