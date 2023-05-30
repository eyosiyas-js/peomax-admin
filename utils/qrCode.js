const QRCode = require("qrcode");
const nodemailer = require("nodemailer");

require("dotenv").config();

async function qrCode(text, clientName, clientEmail) {
  try {
    const qrcode = await QRCode.toDataURL(text);

    const code = `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Virtual Ticket</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f2f2f2;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      h1 {
        text-align: center;
        color: #333333;
      }
      p {
        color: #666666;
        line-height: 1.5;
        margin-bottom: 20px;
      }
      .qrcode-container {
        text-align: center;
        margin-top: 40px;
      }
      .qrcode-image {
        max-width: 200px;
        height: auto;
      }
      .note {
        font-style: italic;
        font-size: 14px;
        color: #999999;
        text-align: center;
      }
      .footer {
        margin-top: 40px;
        text-align: center;
        color: #666666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Virtual Ticket</h1>
      <p>Hello ${clientName},</p>
      <p>
        Thank you for booking a ticket through the ReserveET service. To verify your virtual ticket,
        scan the qrcode under at the site of the event.
      </p>
      <div class="qrcode-container">
        <img
          class="qrcode-image"
            src="cid:unique3423423@kre234234ata.e234234e"
          alt="QR Code"
        />
      </div>
      <p class="note">
        Note: The QR code is unique to your ticket and should not be shared
        with anyone.
      </p>
      <div class="footer">
        <p>
          If you have any questions or need assistance, please contact our
          support team.
        </p>
        <p>Thank you,</p>
        <p>ReserveET</p>
      </div>
    </div>
  </body>
</html>

    `;

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

module.exports = qrCode;
