const express = require("express");
const router = express.Router();
const Image = require("../models/Image");

router.get("/:id", async (req, res) => {
  try {
    const image = await Image.findOne({ ID: req.params.id });

    if (!image) return res.status(404).send({ error: "Image not found" });

    res.contentType(image.contentType);
    res.send(image.data);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Error getting image" });
  }
});

module.exports = router;
