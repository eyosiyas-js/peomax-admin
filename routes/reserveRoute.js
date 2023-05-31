const express = require("express");
const Restaurant = require("../models/Restaurant");
const Hotel = require("../models/Hotel");
const Bar = require("../models/Bar");
const Club = require("../models/Club");
const reserveMail = require("../utils/reserveMail");
const userChecker = require("../middleware/userChecker");

const router = express.Router();

router.post("/", userChecker, async (req, res) => {
  try {
    await reserveMail(req.user.firstName, req.user.email);

    res.send({ message: "Email sent" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't get all spots" });
  }
});

module.exports = router;
