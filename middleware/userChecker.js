const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User.js");
const Product = require("../models/Restaurant.js");
const dotenv = require("dotenv");
dotenv.config();

module.exports = async function (req, res, next) {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      const token = req.headers.authorization.split("Bearer ")[1];
      const decoded = await jwt.verify(
        token,
        process.env.access_token_secret_key
      );

      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).send({ error: "Invalid/expired Token" });
    }
  } else {
    res.status(403).send({ error: "No token provided" });
  }
};
