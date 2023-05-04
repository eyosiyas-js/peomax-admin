const express = require("express");
const Product = require("../models/Restaurant.js");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const regex = new RegExp(req.query.q, "i");

    const products = await Product.find({
      $or: [
        { category: { $regex: regex } },
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { brand: { $regex: regex } },
      ],
    })
      .sort({ name: 1 })
      .skip(startIndex)
      .limit(limit);

    const productCount = products.length;

    const results = {
      page: page,
      limit: limit,
      totalPages: Math.ceil(productCount / limit),
      totalProducts: productCount,
      products: products,
    };

    res.send(results);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: `Could not search ${req.query.q}.` });
  }
});

module.exports = router;
