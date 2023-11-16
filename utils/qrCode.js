const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const { readFileSync } = require("fs");

require("dotenv").config();

async function qrCode(ticketID, clientName, clientEmail, ticket, event) {
  let eventEmail = readFileSync("./emails/event.html", "utf-8");

  try {
    const qrcode = await QRCode.toDataURL(ticketID);

    eventEmail = eventEmail.replace("{{clientName}}", clientName);
    eventEmail = eventEmail.replace("{{eventName}}", event.name);
    eventEmail = eventEmail.replace("{{people}}", ticket.people);
    eventEmail = eventEmail.replace("{{date}}", event.date);
    eventEmail = eventEmail.replace("{{time}}", ticket.time);
    eventEmail = eventEmail.replace(
      "{{premium}}",
      ticket.isPremium
        ? '<span class="premium">premium</span>'
        : '<span class="regular">regular</span>'
    );

    const code = eventEmail;
    let transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      auth: {
        user: process.env.email,
        pass: process.env.email_password,
      },
    });

    let message = {
      to: clientEmail,
      subject: "Virtual Ticket",
      html: code,
      attachments: [
        {
          filename: "qrcode.png",
          cid: "unique3423423@kre234234ata.e234234e",
          path: qrcode,
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
  } catch (err) {
    console.log(err);
  }
}

module.exports = qrCode;
