const mailgen = require("mailgen");
const nodemailer = require("nodemailer");

require("dotenv").config();

const sendEmail = async (clientName, clientEmail, type, code) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    auth: {
      user: process.env.email,
      pass: process.env.email_password,
    },
  });

  let MailGenerator = new mailgen({
    theme: "default",
    product: {
      name: "Reserve ET",
      link: "https://reserveet.onrender.com",
    },
  });

  const template = {};

  if (type == "emailVerification") {
    template.intro =
      "Welcome to Reserve ET! We're very excited to have you on board.";
    template.instruction =
      "Please copy and paste the following code to verify your email:";
  } else if (type == "resetPassword") {
    template.intro =
      "Their has been a request from you to change your account password";
    template.instruction =
      "Please copy and paste the following code to reset your password:";
  } else if (type == "reserveEmail") {
    template.intro =
      "This email has been sent to inform you about your reservation.";
    template.instruction =
      "This email has been sent to inform you about your reservation.";
  }

  const email = {
    body: {
      name: clientName,
      intro: template.intro,
      action: {
        instructions: template.instruction,
        button: {
          color: "#22BC66",
          text: code,
        },
      },
      outro: "If you did not request this action simply ignore this email.",
    },
  };

  const emailBody = MailGenerator.generate(email);

  let message = {
    from: process.env.email,
    to: clientEmail,
    subject:
      type == "emailVerification"
        ? "Account email verification"
        : "Account password reset",
    html: emailBody,
  };

  // send mail
  try {
    await transporter.sendMail(message);
    return { success: true, message: `We've sent an email to ${clientEmail}.` };
  } catch (error) {
    console.log(error);
    return { success: false, error: `Could not send email to ${clientEmail}` };
  }
};

module.exports = sendEmail;
