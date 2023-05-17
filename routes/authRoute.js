const express = require("express");
const User = require("../models/User.js");
const OTP = require("../models/OTP.js");
const Token = require("../models/Token.js");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/mail.js");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");

const {
  validateSignupData,
  validateLoginData,
} = require("../utils/validator.js");
const { uid } = require("uid");

require("dotenv").config();

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { valid, errors } = await validateSignupData(req.body);
    if (!valid) return res.status(400).json(errors);

    const { firstName, lastName, password, confirmPassword, email } = req.body;

    const existingUser = await User.findOne({ email: email });

    if (existingUser)
      return res.status(400).send({ error: "User already exists." });
    if (password !== confirmPassword)
      return res.status(400).send({ error: "Passwords do not match" });

    const saltRounds = parseInt(process.env.saltRounds);
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      userID: uid(16),
      firstName: firstName,
      lastName: lastName,
      password: hashedPassword,
      email: email,
      role: "client",
    };

    const user = new User(userData);

    const code = await otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    const otp = new OTP({
      userID: userData.userID,
      code: code,
      type: "emailVerification",
    });
    await otp.save();

    const response = await sendEmail(
      firstName,
      email,
      "emailVerification",
      code
    );

    if (!response.success)
      return res
        .status(400)
        .send({ error: `Could not send verification code to ${email}` });

    await user.save();
    res.send({ message: "Verify your email address" });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error saving signup user." });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const { code } = req.body;
    const otp = await OTP.findOne({ code: code, type: "emailVerification" });
    if (!otp)
      return res.status(400).send({ error: "Incorrect or expired code" });

    await User.findOneAndUpdate({ userID: otp.userID }, { verified: true });
    const user = await User.findOne({ userID: otp.userID });

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      password: user.password,
      email: user.email,
      userID: user.userID,
      role: user.role,
    };

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
    res.status(500).send({ error: "Could not verify code" });
  }
});

router.post("/auth-provider", async (req, res) => {
  try {
    const { firstName, lastName, email, verified } = req.body;

    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      const userData = {
        userID: existingUser.userID,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: existingUser.email,
        verified: !existingUser.verified ? false : true,
        role: existingUser.role,
      };

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
      const status = "login";

      res.send({ status, token, refresh_token, userData });
    } else {
      const userData = {
        userID: uid(16),
        firstName: firstName,
        lastName: lastName,
        email: email,
        verified: !verified ? false : true,
        role: "client",
      };

      const user = new User(userData);
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
      const status = "signup";

      res.send({ status, token, refresh_token, userData });
    }
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

    if (!user) return res.status(404).send({ error: "User not found" });
    if (!user.verified)
      return res.status(404).send({ error: "User not verified" });

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
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

    res.send({ token, refresh_token, userData });
  } catch (error) {
    res.status(500).send({ error: "Could not loggin user." });
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
    const user = await User.findOne({ email: email });

    if (!user)
      return res
        .status(404)
        .send({ error: `No user found with the email ${email}` });

    const otp = new OTP({
      userID: user.userID,
      code: code,
      type: "resetPassword",
    });
    otp.save();

    const response = await sendEmail(
      user.firstName,
      email,
      "resetPassword",
      code
    );

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
//     const otp = await OTP.findOne({ code: code, type: "resetPassword" });

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

  try {
    const otp = await OTP.findOne({ code: code, type: "resetPassword" });
    if (!otp)
      return res.status(404).send({ error: "Incorrect or expired code" });

    if (newPassword !== confirmNewPassword)
      return res.status(404).send({ error: "Passwords do not match" });
    const user = await User.findOne({ userID: otp.userID });

    const saltRounds = parseInt(process.env.saltRounds);
    const salt = await bcrypt.genSalt(saltRounds);
    const newhashedPassword = await bcrypt.hash(newPassword, salt);

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
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
