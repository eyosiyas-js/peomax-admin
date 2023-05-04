const express = require("express");
const User = require("../models/User.js");
const Review = require("../models/Review.js");
const userChecker = require("../middleware/userChecker.js");

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const reviews = await Review.find({ productID: req.params.id });
    if (!reviews)
      return res.status(404).send({
        error: `No reviews found for product with id: ${req.params.id}`,
      });

    res.send(reviews);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Error getting reviews" });
  }
});

router.post("/", userChecker, async (req, res) => {
  try {
    const user = await User.findOne({ userID: req.user.userID });
    const { firstName, lastName, profilePicture } = user;

    const { text, rating, productID } = req.body;

    const review = new Review({
      userID: req.user.userID,
      firstName: firstName,
      lastName: lastName,
      profilePicture: profilePicture,
      rating: rating,
      text: text,
      productID: productID,
    });

    await review.save();

    res.send({ message: "Review Submitted." });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Could not add review" });
  }
});

module.exports = router;
