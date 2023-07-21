const { uid } = require("uid");
const uploadFile = require("../utils/upload");
const formats = require("../utils/formats");
const { validateDiningPlace } = require("../utils/validator");
const extractMain = require("../utils/extractMain");
const { unlinkSync } = require("fs");
const checkAuthorization = require("../utils/checkAuthorization");
const { validateEditDiningPlace } = require("../utils/validator");

async function createDiningService(req, res, diningPlaceModel) {
  try {
    const exists = await extractMain(req.user.userID);
    if (exists && req.body.subHotel !== "true")
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
      subHotel: subHotel == "true" ? true : false,
      status: "pending",
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

async function editDiningService(req, res, diningPlaceModel) {
  try {
    const valid = validateEditDiningPlace(req.body);
    if (!valid.success) return res.status(400).send({ error: valid.message });

    const managerID = req.user.userID;

    const diningPlace = await diningPlaceModel.findOne({
      ID: req.params.id,
    });

    if (!diningPlace)
      return res.status(403).send({
        error: `No ${diningPlaceModel.modelName.toLowerCase()} place with ID: ${
          req.params.id
        } found`,
      });

    const isAuthorized = checkAuthorization(managerID, diningPlace);

    if (!isAuthorized)
      return res.status(401).send({ error: "Unauthorized action" });

    let urls = [];
    if (req.query.files == "true") {
      const files = await req.files;
      let hasInvalidFile = false;
      urls = await Promise.all(
        files.map(async (file) => {
          const { path, filename, mimetype } = file;
          if (!formats.includes(mimetype)) {
            unlinkSync(path);
            hasInvalidFile = true;
            return "none";
          } else {
            const response = await uploadFile(path, filename, mimetype);
            if (response.status !== "error") return response.url;
            if (response.status !== "error") return "none";
          }
        })
      );

      if (hasInvalidFile) {
        return res.status(400).send({ error: "Invalid file type" });
      }

      files.map((file) => unlinkSync(file.path));
    }

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
    } = req.body;

    diningPlace.name = name ?? diningPlace.name;
    diningPlace.description = description ?? diningPlace.description;
    diningPlace.location = location ?? diningPlace.location;
    diningPlace.branches = req.body.branches || [];
    diningPlace.image = urls.length !== 0 ? urls[0] : diningPlace.image;
    diningPlace.images = urls.length !== 0 ? urls : diningPlace.images;
    diningPlace.rating = req.body.rating || 0;
    diningPlace.availableSpots = availableSpots ?? diningPlace.availableSpots;
    diningPlace.totalSpots = totalSpots ?? diningPlace.totalSpots;
    diningPlace.openingTime = openingTime ?? diningPlace.openingTime;
    diningPlace.closingTime = closingTime ?? diningPlace.closingTime;

    diningPlace.crossStreet = crossStreet ?? diningPlace.crossStreet;
    diningPlace.neighborhood = neighborhood ?? diningPlace.neighborhood;
    diningPlace.cuisines = cuisines ?? diningPlace.cuisines;
    diningPlace.diningStyle = diningStyle ?? diningPlace.diningStyle;
    diningPlace.dressCode = dressCode ?? diningPlace.dressCode;
    diningPlace.parkingDetails = parkingDetails ?? diningPlace.parkingDetails;
    diningPlace.publicTransit = publicTransit ?? diningPlace.publicTransit;
    diningPlace.paymentOptions = paymentOptions ?? diningPlace.paymentOptions;
    diningPlace.additional = additional ?? diningPlace.additional;
    diningPlace.phoneNumber = phoneNumber ?? diningPlace.phoneNumber;
    diningPlace.website = website ?? diningPlace.website;

    await diningPlace.save();

    res.send(diningPlace.toObject());
  } catch (error) {
    res.status(500).send({ error: "Error updating dining place" });
    console.log(error);
  }
}

module.exports = { createDiningService, editDiningService };
