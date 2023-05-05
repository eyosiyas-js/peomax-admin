const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoute = require("./routes/authRoute.js");
const usersRoute = require("./routes/usersRoute.js");
const adminRoute = require("./routes/adminRoute.js");
const sendEmail = require("./utils/mail.js");
// const restaurantsRoute = require("./routes/restaurantsRoute.js");
// const reserveRoute = require("./routes/reserveRoute.js");
// const eventRoute = require("./routes/eventRoute.js");
// const searchRoute = require("./routes/searchRoute.js");
// const reviewRoute = require("./routes/reviewRoute.js");
// const paymentRoute = require("./routes/paymentRoute.js");

dotenv.config();

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
const port = process.env.PORT || 4000;
const mongo_url = process.env.mongo_url;

// app.use(helmet());
// app.use(limiter);
// app.disable("x-powered-by");
app.use(express.json());
app.use(cors({ origin: "*" }));

app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/admin", adminRoute);

// app.use("/api/restaurants", restaurantsRoute);
// app.use("/api/reserve", reserveRoute);
// app.use("/api/event", eventRoute);

// app.use("/api/search", searchRoute);
// app.use("/api/review", reviewRoute);
// app.use("/api/payment", paymentRoute);

app.get("/api", (req, res) => {
  res.send(`Hello World! ${req.protocol}://${req.hostname}`);
});

app.get("/mail", async (req, res) => {
  const ress = await sendEmail(
    "Vemoz",
    "vemozelvagz@gmail.com",
    "emailVerification",
    1234
  );
  res.send(ress);
});

mongoose.set("strictQuery", false);
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected!");
    app.listen(port, () =>
      console.log(`Listening on: http://localhost:${port}`)
    );
  })
  .catch((err) => console.error(err));
