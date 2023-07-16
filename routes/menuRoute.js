const express = require("express");
const router = express.Router();
const Menu = require("../models/Menu");
const superVisorChecker = require("../middleware/superVisorChecker");
const findPlace = require("../utils/findPlace");
const checkAuthorization = require("../utils/checkAuthorization");

const uploadFile = require("../utils/upload");
const { uid } = require("uid");
const multer = require("multer");
const { unlinkSync, existsSync, mkdirSync } = require("fs");
const { join } = require("path");
const storage = join(process.cwd(), "./uploads");
const formats = require("../utils/formats");

const { validateMenu } = require("../utils/validator");

if (!existsSync(storage)) {
  mkdirSync(storage);
}

const uploads = multer({ dest: storage });

router.get("/", async (req, res) => {
  try {
    const menus = await Menu.find({});
    re.send(menus);
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const menu = await Menu.findOne({ ID: req.params.id });
    if (!menu) return res.status(404).send({ error: "Menu not found" });
    re.send(menu.toObject());
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error" });
  }
});

router.post(
  "/create",
  superVisorChecker,
  uploads.array("images", 10),
  async (req, res) => {
    try {
      const valid = await validateMenu(req.body);
      if (!valid.success) return res.status(400).send({ error: valid.message });

      const managerID = req.user.userID;

      const place = await findPlace(req.body.ID, req.body.category);
      if (!place)
        return res.status(400).send({ error: `${category} not found` });

      const isAuthorized = checkAuthorization(managerID, place);
      if (!isAuthorized)
        return res.status(401).send({ error: "Unauthorized action" });

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

      const { name, description, category, group, ID, fasting, price } =
        req.body;

      const menu = new Menu({
        name: name,
        description: description,
        image: images[0],
        group: group,
        category: category,
        ID: ID,
        price: price,
        fasting: fasting == true ? true : false,
        menuID: uid(16),
      });

      await menu.save();

      res.send(menu);
    } catch (error) {
      res.status(500).send({ error: "Error creating an menu" });
      console.log(error);
    }
  }
);

module.exports = router;
