const QRCode = require("qrcode");

async function qrCode(text) {
  try {
    const qrcode = await QRCode.toDataURL(text);
    return qrcode;
  } catch (err) {
    console.log(err);
  }
}

module.exports = qrCode;
