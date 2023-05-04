const express = require("express");
const Order = require("../models/Reservation.js");
const Product = require("../models/Restaurant.js");
const User = require("../models/User.js");
const adminChecker = require("../middleware/adminChecker.js");
const userChecker = require("../middleware/userChecker.js");
const { uid } = require("uid");

const router = express.Router();

router.get("/find/:id", async (req, res) => {
  try {
    const order = await Order.findOne({ orderID: req.params.id });

    if (!order) return res.status(404).send({ error: "Order not found." });

    res.send(order.toObject());
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Could not find order" });
  }
});

router.get("/all", adminChecker, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status } = req.query;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const validStatuses = ["pending", "confirmed", "onway", "delivered"];
    if (status && !validStatuses.includes(status))
      return res.status(400).send({ error: "Invalid status" });

    const query = status
      ? { status: status, $ne: "cancelled" }
      : { status: { $ne: "cancelled" } };

    const ordersCount = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ date: 1 })
      .skip(startIndex)
      .limit(limit);

    const results = {
      page: page,
      limit: limit,
      totalPages: Math.ceil(ordersCount / limit),
      totalOrders: ordersCount,
      orders: orders,
    };

    res.send(results);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Error getting orders" });
  }
});

router.post("/", userChecker, async (req, res) => {
  try {
    const { items, address } = req.body;

    const productIDs = items.map((item) => item.productID);

    const products = await Product.find({ productID: { $in: productIDs } });

    const itemsWithPrices = items.map((item) => {
      const product = products.find(
        (product) => product.productID === item.productID
      );
      return { ...item, price: product.price };
    });

    const totalPrice = itemsWithPrices.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    const orderData = new Order({
      userID: req.user.userID,
      address: {
        region: address.region,
        city: address.city,
        street: address.street,
        maplink: address.maplink ? address.maplink : null,
        gpsLocation: address.gpsLocation ? address.gpsLocation : {},
      },
      items: itemsWithPrices,
      total: totalPrice,
      status: "pending",
      orderID: uid(16),
    });

    const order = new Order(orderData);

    await order.save();

    res.send(order);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Could not submit order." });
  }
});

router.post("/cancel/:id", userChecker, async (req, res) => {
  try {
    if (!req.params.id)
      return res.status(403).send({ error: "No orderID provided" });
    const order = await Order.findOne({ orderID: req.params.id });
    if (!order)
      return res
        .status(403)
        .send({ error: `No order with Id: ${req.params.id}}` });

    if (order.status == "cancelled")
      return res.status(400).send({ message: "Order already cancelled" });

    if (order.status == "onway" || order.status == "delivered")
      return res.status(400).send({ error: `Order is ${order.status}}` });

    order.status = "cancelled";

    await order.save();
    res.send({ message: "Order cancelled" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Could not assign delivery." });
  }
});

router.post("/assign", adminChecker, async (req, res) => {
  try {
    const { deliveryID, orderID } = req.body;
    const delivery = await User.findOne({ userID: deliveryID });

    if (!delivery)
      return res
        .status(404)
        .send({ error: `Couldn't find delivery with ID: ${delivery}.` });

    const order = await Order.findOne({ orderID: orderID });

    if (!order)
      return res
        .status(404)
        .send({ error: `Couldn't find order with ID: ${orderID}.` });

    order.deliveryID = deliveryID;
    order.status = "confirmed";
    await order.save();
    res.send({ message: "Assigned order to delivery." });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Could not assign delivery." });
  }
});

module.exports = router;
