const express = require("express");
const haversine = require("haversine");
const Restaurant = require("../models/Restaurant");
const Hotel = require("../models/Hotel");
const Bar = require("../models/Bar");
const Club = require("../models/Club");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't get nearby spots" });
  }
});

module.exports = router;
