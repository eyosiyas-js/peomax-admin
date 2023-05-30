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
    subject: type,
    html: type !== "qrCode" ? emailBody : code,
    attachments: [
      {
        filename: "qrcode.png",
        cid: "unique@kreata.ee",
        path: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAYAAABRRIOnAAAAAklEQVR4AewaftIAAAOFSURBVO3BQY4jRwADwWSh///l9B584KkAQdJ41mBE/IOZfx1mymGmHGbKYaYcZsphphxmymGmHGbKYaYcZsphphxmymGmHGbKw5uS8JNUWhJuVFoSPknlJgk/SeUdh5lymCmHmfLwYSqflIR3JOFGpSXhm1Q+KQmfdJgph5lymCkPX5aEV6i8Q6Ul4ZNUPikJr1D5psNMOcyUw0x5+Mup3Ki0JNyotCS0JNyo/M0OM+UwUw4z5eEvl4QblVckoam0JDSV/5PDTDnMlMNMefgylW9SeUcSbpLQVFoSmsorVH6Tw0w5zJTDTHn4sCT8pCQ0lZaEptKS0FRaEj4pCb/ZYaYcZsphpjy8SeW/pNKS8Juo/E0OM+UwUw4zJf7BG5LQVG6S8JNUWhJ+kspNEppKS8IrVN5xmCmHmXKYKfEPPigJNyotCU3lFUm4UblJQlNpSWgqN0l4hcorknCj8o7DTDnMlMNMeXhTEprKTRKayk0SmkpTeYfKT1JpSfhNDjPlMFMOM+Xhw5LQVG6ScKPyjiQ0lZaEpvKKJLxD5SYJP+kwUw4z5TBTHr4sCU3lJgktCU2lJaGpNJUblZaEd6jcJOFGpam0JHzTYaYcZsphpjx8mUpLQlO5UWlJaCotCU3lJglN5RUqN0loKjdJ+C8dZsphphxmysMvl4SbJDSVV6jcJKGp3CShqbQkNJWm0pLQVFoSPukwUw4z5TBTHj5M5UblFSrvSEJTaUn4piTcJOFGpSXhmw4z5TBTDjPl4cuS0FRaEppKS8IrVJpKS8KNyk0Svknlv3SYKYeZcpgpD29SuVG5UblRuUnCO1Q+SeUVSbhJwo3KJx1mymGmHGbKw5uS8JNU3qHSkvBNSWgqN0loKjdJaCrvOMyUw0w5zJSHD1P5pCR8UhKaSktCU7lJwo3KJyXhmw4z5TBTDjPl4cuS8AqVT0rCT0rCO1RaEppKS8InHWbKYaYcZsrD/0wSblRaEl6RhBuVVyThNznMlMNMOcyUh7+cyk0SWhKaSkvCjcpNEm5UmkpLQlNpSfimw0w5zJTDTHn4MpWflISm0pLQkvCOJDSVloSWhKbSVFoSftJhphxmymGmPHxYEn5SEppKS8I3qbQk3Ki0JNyo3CThkw4z5TBTDjMl/sHMvw4z5TBTDjPlMFMOM+UwUw4z5TBTDjPlMFMOM+UwUw4z5TBTDjPlHwrmfywqF9OrAAAAAElFTkSuQmCC",
      },
    ],
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
