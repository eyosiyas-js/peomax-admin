const express = require("express");
const userChecker = require("../middleware/userChecker");
const qrCode = require("../utils/qrCode");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (!req.query.text)
      return res.status(400).send({ error: "No text provided" });
    const qrcode = await qrCode("Hello my niggas chupa pi");
    res.send({ qrcode });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Qrcode error" });
  }
});

router.get("/verify", async (req, res) => {
  try {
    if (!req.query.text)
      return res.status(400).send({ error: "No verification key provided" });

    res.send({ qrcode });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Qrcode error" });
  }
});
module.exports = router;
