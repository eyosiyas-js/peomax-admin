const { uid } = require("uid");
const Image = require("../models/Image");
const fs = require('fs');

async function uploadFile(filePath, fileName, fileType) {
  try {
    const name = fileName+uid(6);
    const data = fs.readFileSync(filePath);

    const image = new Image({
      ID: name,
      contentType: fileType,
      data: data
    });

    await image.save();

    const url = `https://api.peomax.com/images/${name}`;
    return { status: "success", url: url };
  } catch (error) {
    console.log(error);
    return { status: "error", error: error };
  }
}

module.exports = uploadFile;
