const express = require("express");
const socketIo = require("socket.io");
const { createServer } = require("http");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoute = require("./routes/authRoute.js");
const usersRoute = require("./routes/usersRoute.js");
const accountRoute = require("./routes/accountRoute.js");
const adminRoute = require("./routes/adminRoute.js");
const managerRoute = require("./routes/managerRoute.js");
const supervisorRoute = require("./routes/supervisorRoute.js");
const employeeRoute = require("./routes/employeeRoute.js");
const restaurantsRoute = require("./routes/restaurantsRoute.js");
const barsRoute = require("./routes/barsRoute.js");
const clubsRoute = require("./routes/clubsRoute.js");
const hotelsRoute = require("./routes/hotelsRoute.js");
const searchRoute = require("./routes/searchRoute.js");
const allRoute = require("./routes/allRoute.js");
const topRatedRoute = require("./routes/topRatedRoute.js");
const featuredRoute = require("./routes/featuredRoute.js");
const subhotelsRoute = require("./routes/subhotelsRoute.js");
const menuRoute = require("./routes/menuRoute.js");
const nearbyRoute = require("./routes/nearbyRoute.js");
const geolocationRoute = require("./routes/geolocationRoute.js");
const reserveRoute = require("./routes/reserveRoute.js");
const reservationsRoute = require("./routes/reservationsRoute.js");
const overviewRoute = require("./routes/overviewRoute.js");
const eventsRoute = require("./routes/eventsRoute.js");
const ticketRoute = require("./routes/ticketRoute.js");
const ticketsRoute = require("./routes/ticketsRoute.js");
const availableSpotsRoute = require("./routes/availableSpotsRoute.js");
const imagesRoute = require("./routes/imagesRoute.js");

dotenv.config();

// const limiter = rateLimit({
//   windowMs: 5 * 60 * 1000,
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
// });

const app = express();
const server = createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
const port = process.env.PORT || 4000;
const mongo_url = process.env.mongo_url;

app.use(cors({ origin: "*" }));

app.use((req, res, next) => {
  req.io = io;
  return next();
});

app.use(helmet());
// app.use(limiter);
app.disable("x-powered-by");
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/account", accountRoute);
app.use("/api/admin", adminRoute);
app.use("/api/manager", managerRoute);
app.use("/api/supervisor", supervisorRoute);
app.use("/api/employee", employeeRoute);
app.use("/api/overview", overviewRoute);

app.use("/api/restaurants", restaurantsRoute);
app.use("/api/hotels", hotelsRoute);
app.use("/api/clubs", clubsRoute);
app.use("/api/bars", barsRoute);

app.use("/api/search", searchRoute);
app.use("/api/all", allRoute);
app.use("/api/featured", featuredRoute);
app.use("/api/top-rated", topRatedRoute);
app.use("/api/sub-hotels", subhotelsRoute);
app.use("/api/nearby", nearbyRoute);
app.use("/api/geolocation", geolocationRoute);
app.use("/api/menu", menuRoute);

app.use("/images",imagesRoute)
app.use("/api/events", eventsRoute);
app.use("/api/reserve", reserveRoute);
app.use("/api/reservations", reservationsRoute);
app.use("/api/ticket", ticketRoute);
app.use("/api/tickets", ticketsRoute);
app.use("/api/available-spots", availableSpotsRoute);

app.get("/api", (req, res) => {
  res.send(`Hello World! ${req.protocol}://${req.hostname}`);
});

mongoose.set("strictQuery", false);
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected!");
    server.listen(port, () =>
      console.log(`Listening on: http://localhost:${port}`)
    );
  })
  .catch((err) => console.error(err));
