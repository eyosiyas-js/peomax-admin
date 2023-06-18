const nodemailer = require("nodemailer");
const { readFileSync } = require("fs");

require("dotenv").config();

async function sendEmail(clientName, clientEmail, subject, verificationCode) {
  const logo = readFileSync("./assets/logo.jpg", "base64");
  let verificationEmail = readFileSync("./emails/verification.html", "utf-8");

  const emailVerificationText = `
    <p>Welcome to Peomax Reservation!</p>
    <br/>
    Thank you for choosing our services. We are excited to have you as
    part of our community. With Peomax Reservation, you can discover and
    book the finest accommodations, creating unforgettable experiences for
    your travels.
    <br />
    Enter the verification code provided above to complete your account
    setup and unlock the full potential of Peomax Reservation.
  `;

  const resetPasswordText = `
    <p>Peomax Reservation</p>
    <br/>
    Dear ${clientName},
    <br/>
    There has been a request from your email to change your
    peomax account password.
    <br />
    Enter the verification code provided above to change your account password.

    if you did not request this message simply ignore it.
  </p> 
  `;

  let subjectText =
    subject === "email verification"
      ? emailVerificationText
      : resetPasswordText;

  let modifiedEmail = verificationEmail.replace("{{text}}", subjectText);
  modifiedEmail = modifiedEmail.replace("{{code}}", verificationCode);

  let transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    auth: {
      user: process.env.email,
      pass: process.env.email_password,
    },
  });

  let message = {
    from: process.env.email,
    to: clientEmail,
    subject: subject,
    html: modifiedEmail,
    attachments: [
      {
        filename: "logo.png",
        cid: "6044075355",
        path: `data:image/jpeg;base64,${logo}`,
      },
    ],
  };

  try {
    await transporter.sendMail(message);
    return {
      success: true,
      message: `We've sent an email to ${clientEmail}.`,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error: `Could not send email to ${clientEmail}`,
    };
  }
}

module.exports = sendEmail;
