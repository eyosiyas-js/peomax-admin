const express = require("express");
const Restaurant = require("../models/Restaurant");
const adminChecker = require("../middleware/adminChecker");
const { uid } = require("uid");

// const multer = require("multer");
// const { unlinkSync, rmSync, existsSync, mkdirSync } = require("fs");
// const { join } = require("path");
// const uploadFile = require("../utils/upload.js");

// const storage = join(process.cwd(), "./uploads");
// const formats = [
//   "image/jpeg",
//   "image/jpg",
//   "image/png",
//   "image/bmp",
//   "image/webp",
//   "image/tiff",
//   "image/svg+xml",
//   "image/x-icon",
// ];

// if (!existsSync(storage)) {
//   mkdirSync(storage);
// }

// const uploads = multer({ dest: storage });

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({});
    res.send(restaurants.map((restaurants) => restaurants.toObject()));
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error getting restaurants" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      restaurantID: req.params.id,
    });
    res.send(restaurant.toObject());
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error: `Couldn't find a restaurant with the ID: ${req.params.id}`,
    });
  }
});

router.get("/category/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.find({ category: req.params.id });
    res.send(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error: `Couldn't find restaurants with category: ${req.params.id}`,
    });
  }
});

router.get("/related/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      restaurantID: req.params.id,
    });

    if (!restaurant)
      return res
        .status(400)
        .send({ error: `No restaurant found with ID:  ${restaurantID}` });

    const related_restaurants = await Restaurant.find({
      $and: [
        { restaurantID: { $ne: restaurant.restaurantID } },
        {
          $or: [
            { category: { $regex: new RegExp(restaurant.category, "i") } },
            {
              sub_category: {
                $regex: new RegExp(restaurant.sub_category, "i"),
              },
            },
            { brand: { $regex: new RegExp(restaurant.brand, "i") } },
          ],
        },
      ],
    });

    if (related_restaurants.length == 0)
      return res.status(400).send({ error: "No related restaurants found" });
    res.send(related_restaurants);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error finding related restaurants" });
  }
});

// router.post(
//   "/add",
//   adminChecker,
//   uploads.array("images", 5),
//   async (req, res) => {
//     try {
//       const files = await req.files;
//       let hasInvalidFile = false;
//       const urls = await Promise.all(
//         files.map(async (file) => {
//           const { path, filename, mimetype } = file;
//           if (!formats.includes(mimetype)) {
//             unlinkSync(path);
//             hasInvalidFile = true;
//             return "none";
//           } else {
//             const response = await uploadFile(path, filename, mimetype);
//             if (response.status !== "error") return response.url;
//             if (response.status !== "error") return "none";
//           }
//         })
//       );

//       if (hasInvalidFile) {
//         return res.status(400).send({ error: "Invalid file type" });
//       }

//       files.map((file) => unlinkSync(file.path));

//       const { name, description, category, brand, price, countInStock } =
//         req.body;

//       const restaurant = new restaurant({
//         name: name,
//         description: description,
//         category: category,
//         sub_category: req.body.sub_category ? req.body.sub_category : "",
//         brand: brand,
//         price: price,
//         image: urls[0],
//         images: urls,
//         inStock: countInStock <= 0 ? false : true,
//         countInStock: countInStock,
//         restaurantID: uid(16),
//       });

//       await Restaurant.save();

//       res.send(restaurant.toObject());
//     } catch (error) {
//       res.status(500).send({ error: "Error saving restaurant" });
//       console.log(error);
//     }
//   }
// );

router.post();

router.post("/edit/:id", adminChecker, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      brand,
      price,
      image,
      inStock,
      countInStock,
    } = req.body;
    let restaurant = await Restaurant.findOne({ restaurantID: req.params.id });

    if (!restaurant) {
      return res.status(404).send({ error: "restaurant not found" });
    }

    restaurant.name = name;
    restaurant.description = description;
    restaurant.category = category;
    (restaurant.sub_category = req.body.sub_category
      ? req.body.sub_category
      : ""),
      (restaurant.brand = brand);
    restaurant.price = price;
    restaurant.image = image;
    restaurant.images = req.body.images ? req.body.images : [];
    restaurant.inStock = inStock;
    restaurant.countInStock = countInStock;

    await Restaurant.save();

    res.send(restaurant.toObject());
  } catch (error) {
    res.status(500).send({ error: "Error updating restaurant" });
    console.log(error);
  }
});

router.post("/delete/:id", adminChecker, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      restaurantID: req.params.id,
    });

    if (!restaurant) {
      return res.status(404).send("restaurant not found");
    }

    await Restaurant.remove();

    res.send({
      message: `restaurant with ID ${req.params.id} has been deleted`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error deleting restaurant" });
  }
});

module.exports = router;
