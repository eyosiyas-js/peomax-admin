const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

module.exports = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.includes("Bearer ")
  ) {
    try {
      const token = req.headers.authorization.split("Bearer ")[1];

      if (!token) {
        res.status(403).send({ error: "No token provided" });
      }

      const decoded = jwt.verify(token, process.env.access_token_secret_key);

      req.user = decoded;
    } catch (err) {
      next();
    }
  } else {
    next();
  }
};
