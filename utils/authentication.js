const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const nodemailer = require("nodemailer");
const { validateSignupData, validateLoginData } = require("../utils/validator");

require("dotenv").config();

const Signup = async (req, res) => {
  try {
    const { valid, errors } = validateSignupData({
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.password,
    });

    if (!valid) return res.status(400).json(errors);
    const hashedPassword = await bcrypt.hash(
      req.body.password,
      process.env.salt
    );

    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.email,
        pass: process.env.emailPassword,
      },
    });
    const verificationCode = Math.floor(Math.random() * 100000).toString();
    const userData = {
      email: req.body.email,
      password: hashedPassword,
      confirmPassword: req.body.confirmPassword,
      date: new Date().toISOString(),
      plan: req.body.plan,
      emailVerified: false,
      verificationCode: verificationCode,
    };
    const user = await userModal.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).send({ message: "This email is already taken" });
    } else {
      userModal.create(userData).then((data) => {
        console.log(data);
      });

      transporter
        .sendMail({
          from: "Your App <noreply@av.com>",
          to: userData.email,
          subject: "Verify your email",
          text: `Your verification code is: ${verificationCode}`,
        })
        .then(() => {
          console.log("email sent");
        });

      setTimeout(() => {
        userModal
          .findOneAndDelete({ email: userData.email, emailVerified: false })
          .then(() => {
            console.log("Done!");
          })
          .catch((err) => {
            console.log("Unable to delete");
          });
      }, 2 * 60 * 1000);
      const token = jwt.sign(userData, "access_token_secret_key");

      res.send({ token });
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

const Verify = async (req, res) => {
  const user = await userModal.findOne({
    verificationCode: req.body.verificationCode,
  });

  if (user) {
    const updated = await userModal.findOneAndUpdate(
      { verificationCode: req.body.verificationCode },
      { emailVerified: true, $unset: { verificationCode: 1 } }
    );

    const token = jwt.sign(
      {
        email: updated.email,
        password: updated.password,
        date: updated.date,
        plan: updated.plan,
        emailVerified: updated.emailVerified,
      },
      "access_token_secret_key",
      { expiresIn: "1h" }
    );
    console.log(updated.email);
    return res.send({ token });
  } else {
    return res.status(400).send({ message: "invalid code" });
  }
};

const Login = async (req, res) => {
  try {
    const { valid, errors } = validateLoginData({
      email: req.body.email,
      password: req.body.password,
    });

    if (!valid) return res.status(400).json(errors);

    const user = await userModal.findOne({ email: req.body.email });
    console.log(user);
    if (!user) return res.status(400).send("User not found");
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).send("Incorrect password");
    const token = jwt.sign(
      {
        email: user.email,
        password: user.password,
        date: user.date,
        plan: user.plan,
        emailVerified: user.emailVerified,
      },
      "access_token_secret_key",
      { expiresIn: "1h" }
    );
    res.send({ token });
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = { Signup, Verify, Login };
