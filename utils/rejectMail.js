const nodemailer = require("nodemailer");
const { readFileSync } = require("fs");

require("dotenv").config();

async function reserveMail(clientName, clientEmail) {
  try {
    let reserveEmail = readFileSync("./emails/rejected.html", "utf-8");
    const logo = readFileSync("./assets/logo.jpg", "base64");

    const code = reserveEmail.replace("{{clientName}}", clientName);

    let transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.email,
        pass: process.env.email_password,
      },
    });

    let message = {
      to: clientEmail,
      subject: "Reservation Rejected",
      html: code,
      attachments: [
        {
          filename: "logo.png",
          cid: "6044075355",
          path: `data:image/jpeg;base64,${logo}`,
        },
      ],
    };

    // send mail
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
  } catch (err) {
    console.log(err);
  }
}

module.exports = reserveMail;
