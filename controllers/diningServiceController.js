const { uid } = require("uid");
const { unlinkSync } = require("fs");
const uploadFile = require("../utils/upload");
const formats = require("../utils/formats");

async function createDiningService(req, res, diningPlaceModule) {
  try {
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
      tables,
      availableSpots,
      totalSpots,
      openingTime,
      closingTime,
      numReviews,
      totalBooks,

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
    } = req.body;

    const managerID = req.user.userID;

    const diningPlace = new diningPlaceModule({
      name: name,
      description: description,
      location: location,
      branches: req.body.branches ? req.body.branches : [],
      image: images[0],
      images: images,
      rating: req.body.rating ? req.body.rating : 0,
      tables: tables,
      managerID: managerID,
      availableSpots: availableSpots,
      totalSpots: totalSpots,
      totalSpots: totalBooks,
      openingTime: openingTime,
      closingTime: closingTime,
      numReviews: numReviews,
      totalBooks: totalBooks,
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
    });

    await diningPlace.save();

    res.send(diningPlace);
  } catch (error) {
    res.status(500).send({
      error: `Error adding ${diningPlaceModule.modelName.toLowerCase()}`,
    });
    console.log(error);
  }
}

module.exports = { createDiningService };
