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

const uploads = multer({
  dest: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get("/", async (req, res) => {
  try {
    const menus = await Menu.find({});
    res.send(menus);
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const menu = await Menu.findOne({ menuID: req.params.id });
    if (!menu) return res.status(404).send({ error: "Menu not found" });
    res.send(menu.toObject());
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error" });
  }
});

router.post(
  "/add",
  superVisorChecker,
  uploads.array("images", 1),
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
        return res.status(403).send({ error: "Unauthorized action" });

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

      const { ID, category, name, description, group, fasting, price } =
        req.body;

      const existingMenu = await Menu.findOne({ ID });

      if (!existingMenu) {
        const menu = new Menu({
          ID,
          category,
          menuID: uid(16),
          items: [
            {
              name,
              description,
              image: images[0],
              group,
              fasting: fasting === "true",
              price,
              itemID: uid(16),
            },
          ],
        });

        await menu.save();
        res.send(menu);
      } else {
        existingMenu.items.push({
          name,
          description,
          image: images[0],
          group,
          fasting: fasting === "true",
          price,
          itemID: uid(16),
        });

        await existingMenu.save();
        res.send(existingMenu);
      }
    } catch (error) {
      res.status(400).send({ error: "Error adding item to menu" });
      console.log(error);
    }
  }
);

router.delete("/", superVisorChecker, async (req, res) => {
  try {
    const { menuID, itemID } = req.query;

    const menu = await Menu.findOne({ menuID });
    if (!menu) return res.status(404).send({ error: "Menu not found" });

    const place = await findPlace(menu.ID, menu.category);
    if (!place) return res.status(400).send({ error: `${category} not found` });

    const isAuthorized = checkAuthorization(req.user.userID, place);
    if (!isAuthorized)
      return res.status(403).send({ error: "Unauthorized action" });

    const newItems = menu.items.filter((item) => item.itemID !== itemID);
    menu.items = newItems;

    await menu.save();

    res.send(menu);
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Error deleting item" });
  }
});

module.exports = router;
