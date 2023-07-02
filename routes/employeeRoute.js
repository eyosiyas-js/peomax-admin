const express = require("express");
const User = require("../models/User.js");
const OTP = require("../models/OTP.js");
const Token = require("../models/Token.js");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/mail.js");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const managerChecker = require("../middleware/managerChecker.js");
const findPlace = require("../utils/findPlace.js");

const { validateEmployee } = require("../utils/validator.js");
const { uid } = require("uid");

require("dotenv").config();

const router = express.Router();

router.post("/register", managerChecker, async (req, res) => {
  try {
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

    res.send({ message: "Account created" });
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
    const user = await User.findOne({ email: email, role: "employee" });
    if (!user) return res.status(404).send({ error: "Account not found" });

    const userData = {
      password: user.password,
      email: user.email,
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

    delete userData.password;

    res.send({ token, refresh_token, userData });
  } catch (error) {
    res.status(500).send({ error: "Could not login user" });
    console.log(error);
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const code = await otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    const { email } = req.body;

    if (!email) return res.status(400).send({ error: "Email not provided" });

    const user = await User.findOne({ email: email, role: "employee" });

    if (!user)
      return res
        .status(404)
        .send({ error: `No Account found with the email ${email}` });

    const otp = new OTP({
      userID: user.userID,
      code: code,
      type: "reset password",
    });
    otp.save();

    const response = await sendEmail(user.name, email, "reset password", code);

    if (!response.success)
      return res.status(400).send({ error: response.error });

    res.send({ message: response.message });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Couldn't change password" });
  }
});

// router.post("/verify-code", async (req, res) => {
//   try {
//     const { code } = req.body;
//     const otp = await OTP.findOne({ code: code, type: "reset password" });

//     if (!otp)
//       return res.status(400).send({ error: "Incorrect or expired code" });

//     res.send({ message: "Code verified", code: code });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ error: "Could not verify code" });
//   }
// });

router.put("/change-password", async (req, res) => {
  const { code, newPassword, confirmNewPassword } = req.body;

  if (!code) return res.status(400).send({ error: "Code is required" });
  if (!newPassword || !confirmPassword)
    return res.status(400).send({ error: "Passwords required" });

  try {
    const otp = await OTP.findOne({ code: code, type: "reset password" });
    if (!otp)
      return res.status(404).send({ error: "Incorrect or expired code" });

    if (newPassword !== confirmNewPassword)
      return res.status(404).send({ error: "Passwords do not match" });
    const user = await User.findOne({ userID: otp.userID });

    const saltRounds = parseInt(process.env.saltRounds);
    const salt = await bcrypt.genSalt(saltRounds);
    const newhashedPassword = await bcrypt.hash(newPassword, salt);

    const userData = {
      name: user.name,
      password: newhashedPassword,
      email: user.email,
      userID: user.userID,
      role: user.role,
    };

    await user.save();

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
    console.log(error);
    res.status(500).send({ error: "Couldn't change password" });
  }
});

router.get("/refresh-token", async (req, res) => {
  try {
    if (!req.body.refreshToken)
      return res.status(400).send({ error: "Refresh token not provided" });

    const refresh_token = await Token.findOne({
      token: req.body.refresh_token,
    });
    if (!refresh_token)
      return res.status(401).send({ error: "Invalid/Expired refresh token" });
    const userData = await jwt.verify(
      req.body.refresh_token.slice(7),
      process.env.refresh_token_secret_key
    );

    delete userData.exp;
    delete userData.iat;
    delete userData.password;

    const jwttoken = await jwt.sign(
      userData,
      process.env.access_token_secret_key,
      {
        expiresIn: "30d",
      }
    );

    const token = `Bearer ${jwttoken}`;

    res.send({ token, userData });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Couldn't refresh token" });
  }
});

router.delete("/logout", async (req, res) => {
  try {
    if (!req.body.refreshToken)
      return res.status(400).send({ error: "Refresh token not provided" });

    const refresh_token = await Token.findOne({
      token: req.body.refresh_token,
    });
    if (!refresh_token)
      return res.status(401).send({ error: "Invalid/Expired refresh token" });

    await refresh_token.remove();

    res.send({ message: "Logged out" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Couldn't refresh token" });
  }
});

module.exports = router;
