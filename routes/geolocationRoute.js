const express = require("express");
const managerChecker = require("../middleware/managerChecker");
const findPlace = require("../utils/findPlace");
const checkAuthorization = require("../utils/checkAuthorization");

const router = express.Router();

router.post("/", managerChecker, async (req, res) => {
  try {
    const { ID, category, latitude, longitude } = req.body;
    if (
      !ID ||
      !category ||
      !latitude ||
      !longitude ||
      isNaN(latitude) ||
      isNaN(longitude)
    )
      return res
        .status(400)
        .send({ error: "Please fill all the required info" });

    const place = await findPlace(ID, category);
    if (!place)
      return res.status(400).send({ error: `No ${category} with ID: ${ID}` });

    const isAuthorized = await checkAuthorization(req.user.userID, place);
    if (!isAuthorized)
      return res.status(403).send({ error: "Unauthorized action" });

    place.geoLocation.latitude = latitude;
    place.geoLocation.longitude = longitude;

    await place.save();

    res.send({ message: "Geolocation added" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't add geolocation" });
  }
});

module.exports = router;
