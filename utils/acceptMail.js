const nodemailer = require("nodemailer");
const { readFileSync } = require("fs");

require("dotenv").config();

async function acceptMail(
  clientName,
  clientEmail,
  ID,
  place,
  time,
  date,
  people
) {
  try {
    let reserveEmail = readFileSync("./emails/accepted.html", "utf-8");
    const logo = readFileSync("./assets/logo.jpg", "base64");

    const code = reserveEmail
      .replace(/{{clientName}}/g, clientName)
      .replace(/{{ID}}/g, ID)
      .replace(/{{place}}/g, place.name)
      .replace(/{{location}}/g, place.location)
      .replace(/{{time}}/g, time)
      .replace(/{{date}}/g, date)
      .replace(/{{people}}/g, people);

    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.email,
        pass: process.env.email_password,
      },
    });

    let message = {
      from: process.env.email,
      to: clientEmail,
      subject: "Reservation Successful",
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

module.exports = acceptMail;
