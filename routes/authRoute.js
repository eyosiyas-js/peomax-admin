const express = require("express");
const {
  signup,
  verifyEmail,
  authProvider,
  login,
  resetPassword,
  changePassword,
  refreshToken,
  logout,
  reSend,
} = require("../controllers/authController.js");

const router = express.Router();

router.post("/signup", signup);

router.post("/verify-email", verifyEmail);

router.post("/resend", reSend);

router.post("/auth-provider", authProvider);

router.post("/login", login);

router.post("/reset-password", resetPassword);

router.put("/change-password", changePassword);

router.get("/refresh-token", refreshToken);

router.delete("/logout", logout);

module.exports = router;
