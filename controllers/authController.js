const User = require("../models/User.js");
const OTP = require("../models/OTP.js");
const Token = require("../models/Token.js");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/mail.js");
const jwt = require("jsonwebtoken");
const {
  validateSignupData,
  validateLoginData,
} = require("../utils/validator.js");
const { uid } = require("uid");

require("dotenv").config();

function generateOTP() {
  const chars = "0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    const index = Math.floor(Math.random() * chars.length);
    otp += chars[index];
  }
  return otp;
}

async function generateReference(usr) {
  const chars = "0123456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    const index = Math.floor(Math.random() * chars.length);
    random += chars[index];
  }
  let reference = `peo-${random}${usr.firstName[0].toLowerCase()}${usr.email[1].toLowerCase()}${usr.lastName[0].toLowerCase()}`;

  const referenceExists = await User.findOne({
    role: "client",
    reference: reference,
  });
  if (referenceExists) {
    return await generateReference(usr);
  } else {
    return reference;
  }
}

async function signup(req, res) {
  try {
    const valid = await validateSignupData(req.body);
    if (!valid.success) {
      return res.status(400).send({ error: valid.message });
    }

    const { firstName, lastName, password, confirmPassword, email, reference } =
      req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isBanned) {
        return res.status(400).send({ error: "User is banned" });
      }

      if (existingUser.verified) {
        return res.status(400).send({ error: "User already exists" });
      }

      const prevOtp = await OTP.findOne({
        userID: existingUser.userID,
        type: "email verification",
      });

      if (prevOtp) {
        return res.send({ message: "Verify your email address" });
      }

      if (password !== confirmPassword) {
        return res.status(400).send({ error: "Passwords do not match" });
      }

      const saltRounds = parseInt(process.env.saltRounds);
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);

      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.password = hashedPassword;
      await existingUser.save();

      const code = await generateOTP();

      const otp = new OTP({
        userID: existingUser.userID,
        code,
        type: "email verification",
      });

      await otp.save();

      const response = await sendEmail(
        existingUser.firstName,
        existingUser.email,
        "email verification",
        code
      );

      if (!response.success) {
        return res
          .status(400)
          .send({ error: `Could not send verification code to ${email}` });
      }

      return res.send({ message: "Verify your email address" });
    }

    if (password !== confirmPassword) {
      return res.status(400).send({ error: "Passwords do not match" });
    }

    const saltRounds = parseInt(process.env.saltRounds);
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      userID: uid(16),
      firstName,
      lastName,
      password: hashedPassword,
      email,
      role: "client",
      reference: await generateReference({ firstName, lastName, email }),
      credits: 500,
    };

    if (reference) {
      const affiliate = await User.findOne({
        role: "client",
        reference: reference,
      });
      affiliate.credits = affiliate.credits + 500;
      await affiliate.save();
    }

    const user = new User(userData);

    const code = await generateOTP();

    const otp = new OTP({
      userID: userData.userID,
      code,
      type: "email verification",
    });

    await otp.save();

    const response = await sendEmail(
      firstName,
      email,
      "email verification",
      code
    );

    if (!response.success) {
      return res
        .status(400)
        .send({ error: `Could not send verification code to ${email}` });
    }

    await user.save();
    res.send({ message: "Verify your email address" });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error saving signup user." });
  }
}

async function verifyEmail(req, res) {
  try {
    const { code } = req.body;

    if (!code) return res.status(400).send({ error: "Code not provided" });

    const otp = await OTP.findOne({ code: code, type: "email verification" });
    if (!otp)
      return res.status(400).send({ error: "Incorrect or expired code" });

    const user = await User.findOne({ userID: otp.userID });
    if (!user) return res.status(400).send({ error: "User does not exist" });

    if (user.isBanned) return res.status(403).send({ error: "User is banned" });

    await User.findOneAndUpdate({ userID: otp.userID }, { verified: true });

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      password: user.password,
      email: user.email,
      userID: user.userID,
      role: user.role,
    };

    const token1 = await jwt.sign(
      userData,
      process.env.access_token_secret_key,
      {
        expiresIn: "30d",
      }
    );

    const token2 = await jwt.sign(
      userData,
      process.env.refresh_token_secret_key,
      {
        expiresIn: "60d",
      }
    );

    const token = `Bearer ${token1}`;
    const refresh_token = `Bearer ${token2}`;

    const newRefreshToken = new Token({
      userID: userData.userID,
      token: refresh_token,
    });
    await newRefreshToken.save();

    res.send({ token, refresh_token, userData });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Could not verify code" });
  }
}

async function authProvider(req, res) {
  try {
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email)
      return res.status(400).send({ error: "Please fill the required fields" });

    const existingUser = await User.findOne({ email: email });

    if (existingUser.isBanned)
      return res.status(403).send({ error: "User is banned" });

    if (existingUser) {
      const userData = {
        userID: existingUser.userID,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: existingUser.email,
        verified: true,
        role: existingUser.role,
      };

      const token1 = await jwt.sign(
        userData,
        process.env.access_token_secret_key,
        {
          expiresIn: "30d",
        }
      );

      const token2 = await jwt.sign(
        userData,
        process.env.refresh_token_secret_key,
        {
          expiresIn: "60d",
        }
      );

      const token = `Bearer ${token1}`;
      const refresh_token = `Bearer ${token2}`;

      const newRefreshToken = new Token({
        userID: userData.userID,
        token: refresh_token,
      });
      await newRefreshToken.save();
      const status = "login";

      res.send({ status, token, refresh_token, userData });
    } else {
      const userData = {
        userID: uid(16),
        firstName: firstName,
        lastName: lastName,
        email: email,
        verified: true,
        role: "client",
      };

      const user = new User(userData);
      await user.save();

      const token1 = await jwt.sign(
        userData,
        process.env.access_token_secret_key,
        {
          expiresIn: "30d",
        }
      );

      const token2 = await jwt.sign(
        userData,
        process.env.refresh_token_secret_key,
        {
          expiresIn: "60d",
        }
      );

      const token = `Bearer ${token1}`;
      const refresh_token = `Bearer ${token2}`;

      const newRefreshToken = new Token({
        userID: userData.userID,
        token: refresh_token,
      });
      await newRefreshToken.save();
      const status = "signup";

      res.send({ status, token, refresh_token, userData });
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error saving signup user." });
  }
}

async function reSend(req, res) {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).send({ error: `No user with email ${email}` });

  if (user.verified)
    return res.status(400).send({ error: `User is already verified` });

  const prevOtp = await OTP.findOne({ userID: user.userID });

  if (prevOtp) {
    await prevOtp.remove();
  }

  const code = generateOTP();

  const otp = new OTP({
    userID: user.userID,
    code,
    type: "email verification",
  });

  await otp.save();

  const response = await sendEmail(
    user.firstName,
    email,
    "email verification",
    code
  );

  if (!response.success) {
    return res
      .status(400)
      .send({ error: `Could not send verification code to ${email}` });
  }
  {
    res.send({ message: "Verification email sent" });
  }
}

async function login(req, res) {
  try {
    const valid = await validateLoginData(req.body);
    if (!valid.success) {
      return res.status(400).send({ error: valid.message });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email: email, role: "client" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send({ error: "Incorrect password" });
    }

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    if (user.isBanned) {
      return res.status(403).send({ error: "User is banned" });
    }

    if (!user.verified) {
      const prevOtp = await OTP.findOne({
        userID: user.userID,
        type: "email verification",
      });

      if (prevOtp) {
        return res.status(400).send({
          error: "User unverified",
        });
      } else {
        const code = await generateOTP();
        const otp = new OTP({
          userID: user.userID,
          code: code,
          type: "email verification",
        });
        await otp.save();

        const response = await sendEmail(
          user.firstName,
          user.email,
          "email verification",
          code
        );

        if (!response.success) {
          return res.status(400).send({
            error: `Could not send verification code to ${email}`,
          });
        }

        return res.send({
          message: "User unverified",
        });
      }
    }

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userID: user.userID,
      role: user.role,
    };

    const accessToken = await jwt.sign(
      userData,
      process.env.access_token_secret_key,
      {
        expiresIn: "30d",
      }
    );

    const refreshToken = await jwt.sign(
      userData,
      process.env.refresh_token_secret_key,
      {
        expiresIn: "60d",
      }
    );

    const token = `Bearer ${accessToken}`;
    const refresh_token = `Bearer ${refreshToken}`;

    const newRefreshToken = new Token({
      userID: userData.userID,
      token: refresh_token,
    });

    await newRefreshToken.save();

    res.send({ token, refresh_token, userData });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Could not log in user" });
  }
}

async function resetPassword(req, res) {
  try {
    const code = await generateOTP();

    const { email } = req.body;

    if (!email) return res.status(400).send({ error: "Email not provided" });

    const user = await User.findOne({ email: email });

    if (!user)
      return res
        .status(404)
        .send({ error: `No user found with the email ${email}` });

    const otp = new OTP({
      userID: user.userID,
      code: code,
      type: "reset password",
    });
    otp.save();

    const response = await sendEmail(
      user.firstName,
      email,
      "reset password",
      code
    );

    if (!response.success)
      return res.status(400).send({ error: response.error });

    res.send({ message: response.message });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Couldn't change password" });
  }
}

async function changePassword(req, res) {
  const { code, newPassword, confirmPassword } = req.body;

  if (!code) return res.status(400).send({ error: "Code is required" });
  if (!newPassword || !confirmPassword)
    return res.status(400).send({ error: "Passwords required" });

  try {
    const otp = await OTP.findOne({ code: code, type: "reset password" });
    if (!otp)
      return res.status(404).send({ error: "Incorrect or expired code" });

    if (newPassword !== confirmPassword)
      return res.status(404).send({ error: "Passwords do not match" });

    const user = await User.findOne({ userID: otp.userID });

    const saltRounds = parseInt(process.env.saltRounds);
    const salt = await bcrypt.genSalt(saltRounds);
    const newhashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = newhashedPassword; // Update the user's password

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      password: newhashedPassword,
      email: user.email,
      userID: user.userID,
      role: user.role,
    };

    await user.save(); // Save the user with the updated password

    const token1 = await jwt.sign(
      userData,
      process.env.access_token_secret_key,
      {
        expiresIn: "30d",
      }
    );

    const token2 = await jwt.sign(
      userData,
      process.env.refresh_token_secret_key,
      {
        expiresIn: "60d",
      }
    );

    const token = `Bearer ${token1}`;
    const refresh_token = `Bearer ${token2}`;

    const newRefreshToken = new Token({
      userID: userData.userID,
      token: refresh_token,
    });
    await newRefreshToken.save();

    delete userData.password;

    res.send({ token, refresh_token, userData });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Couldn't change password" });
  }
}

async function refreshToken(req, res) {
  try {
    if (!req.body.refreshToken)
      return res.status(400).send({ error: "Refresh token not provided" });

    const refresh_token = await Token.findOne({
      token: req.body.refresh_token,
    });
    if (!refresh_token)
      return res.status(401).send({ error: "Invalid/Expired refresh token" });
    const userData = await jwt.verify(
      req.body.refresh_token.slice(7),
      process.env.refresh_token_secret_key
    );

    delete userData.exp;
    delete userData.iat;
    delete userData.password;

    const jwttoken = await jwt.sign(
      userData,
      process.env.access_token_secret_key,
      {
        expiresIn: "30d",
      }
    );

    const token = `Bearer ${jwttoken}`;

    res.send({ token, userData });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Couldn't refresh token" });
  }
}

async function logout(req, res) {
  try {
    if (!req.body.refreshToken)
      return res.status(400).send({ error: "Refresh token not provided" });

    const refresh_token = await Token.findOne({
      token: req.body.refresh_token,
    });
    if (!refresh_token)
      return res.status(401).send({ error: "Invalid/Expired refresh token" });

    await refresh_token.remove();

    res.send({ message: "Logged out" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Couldn't refresh token" });
  }
}

module.exports = {
  signup,
  verifyEmail,
  reSend,
  authProvider,
  login,
  resetPassword,
  changePassword,
  refreshToken,
  logout,
};
