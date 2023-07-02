const Hotel = require("../models/Hotel");
const { uid } = require("uid");
const { unlinkSync } = require("fs");
const uploadFile = require("../utils/upload");
const formats = require("../utils/formats");
const { validateDiningPlace } = require("../utils/validator");
const extractMain = require("../utils/extractMain");

async function createDiningService(req, res, diningPlaceModel) {
  try {
    const exists = await extractMain(req.user.userID);
    if (exists !== [])
      return res
        .status(400)
        .send({ error: "You have exceeded the allowed amount of creations" });

    const validation = validateDiningPlace(req.body);
    if (!validation.success) {
      return res.status(400).send({ error: validation.message });
    }

    const files = await req.files;
    let hasInvalidFile = false;
    const images = await Promise.all(
      files.map(async (file) => {
        const { path, filename, mimetype } = file;
        if (!formats.includes(mimetype)) {
          unlinkSync(path);
          hasInvalidFile = true;
          return;
        } else {
          const response = await uploadFile(path, filename, mimetype);
          if (response.status !== "error") return response.url;
          if (response.status !== "error") return "none";
        }
      })
    );

    if (hasInvalidFile)
      return res.status(400).send({ error: "Invalid file type detected" });

    files.map((file) => unlinkSync(file.path));

    const {
      name,
      description,
      location,
      availableSpots,
      totalSpots,
      openingTime,
      closingTime,

      crossStreet,
      neighborhood,
      cuisines,
      diningStyle,
      dressCode,
      parkingDetails,
      publicTransit,
      paymentOptions,
      additional,
      phoneNumber,
      website,
      subHotel,
    } = req.body;

    const managerID = req.user.userID;

    const diningPlace = new diningPlaceModel({
      name: name,
      description: description,
      location: location,
      branches: req.body.branches ? req.body.branches : [],
      image: images[0],
      images: images,
      rating: req.body.rating ? req.body.rating : 0,
      managerID: managerID,
      availableSpots: availableSpots,
      totalSpots: totalSpots,
      openingTime: openingTime,
      closingTime: closingTime,
      ID: uid(16),

      crossStreet: crossStreet,
      neighborhood: neighborhood,
      cuisines: cuisines,
      diningStyle: diningStyle,
      dressCode: dressCode,
      parkingDetails: parkingDetails,
      publicTransit: publicTransit,
      paymentOptions: paymentOptions,
      additional: additional,
      phoneNumber: phoneNumber,
      website: website,
      subHotel: subHotel ?? false,
      status: "approved",
    });

    await diningPlace.save();

    res.send(diningPlace);
  } catch (error) {
    res.status(500).send({
      error: `Error adding ${diningPlaceModel.modelName.toLowerCase()}`,
    });
    console.log(error);
  }
}

module.exports = createDiningService;
