const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/User");

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
      const userData = await User.findOne({ userID: decoded.userID });

      if (userData.isBanned === true)
        return res.status(403).send({ error: "User is banned" });

      next();
    } catch (err) {
      res.status(401).send({ error: "Invalid/expired Token" });
    }
  } else {
    res.status(403).send({ error: "No token provided" });
  }
};
