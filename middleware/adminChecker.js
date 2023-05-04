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
      const decoded = jwt.verify(token, process.env.access_token_secret_key);

      if (decoded.role == "admin") {
        next();
      } else {
        res.status(403).send({ Error: "Action not allowed" });
      }
    } catch (err) {
      res.status(401).send({ Error: "Invalid/expired Token" });
    }
  }
};
