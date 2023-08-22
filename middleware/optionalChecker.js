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
        return next();
      }

      const decoded = jwt.verify(token, process.env.access_token_secret_key);

      req.user = decoded;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
};
