const express = require("express");
const axios = require("axios");
const User = require("../models/User.js");
const Order = require("../models/Reservation.js");
const userChecker = require("../middleware/userChecker.js");
const { uid } = require("uid");

require("dotenv").config();

const router = express.Router();

router.post("/", userChecker, async (req, res) => {
  try {
    const user = await User.findOne({ userID: req.user.userID });
    const order = await Order.findOne({ orderID: req.body.orderID });

    if (order.isPaid)
      return res.status(400).send({ error: "Order already paid" });

    if (!order)
      return res
        .status(404)
        .send({ error: `No order found it id: ${req.body.orderID}}` });

    const { firstName, lastName, email } = user;
    const hostname = `${req.protocol}://${req.hostname}`;

    const txref = `ecomtransaction-${uid(10)}`;

    const response = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        amount: order.total,
        currency: "ETB",
        email: email,
        first_name: firstName,
        last_name: lastName,
        tx_ref: txref,
        callback_url: `${hostname}/api/payment/success/${order.orderID}`,
        return_url: req.body.callback_url || `${hostname}/`,
        "customization[title]": `Order:${order.orderID} payment`,
        "customization[description]": "Delivery payment",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.chapa_secret_key}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status == "success") {
      return res.send({
        status: "success",
        message: "Payment initialized",
        callback_url: req.body.callback_url,
        url: response.data.data.checkout_url,
        tx_ref: txref,
      });
    } else {
      res.status(400).send({ error: "Payment failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: `Could not perform transaction` });
  }
});

router.get("/verify/:id", async (req, res) => {
  try {
    const response = await axios(
      `https://api.chapa.co/v1/transaction/verify/${req.params.id}}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.chapa_secret_key}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status == "success") {
      return res.send({
        status: "success",
        message: "Transaction verified",
        data: response.data.data,
      });
    } else {
      res.status(400).send({
        status: "error",
        message: "Transaction verification failed",
        data: response.data.data,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Verification failed" });
  }
});

router.post("/success/:id", async (req, res) => {
  try {
    console.log("Order!");
    const order = await Order.findOne({ orderID: req.params.id });
    order.isPaid = true;
    await order.save();
    console.log("Saved.");
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
