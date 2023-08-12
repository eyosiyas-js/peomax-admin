const mongoose = require("mongoose");
const User = require("./models/User");
// const fetchAll = require("./utils/fetchAll");
const Reservation = require("./models/Reservation");
const findPlace = require("./utils/findPlace");
const dotenv = require("dotenv");
dotenv.config();

const mongo_url = process.env.mongo_url;

mongoose.set("strictQuery", false);
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("MongoDB connected!");

    const all = await Reservation.find({});
    console.log(all.length);

    for (let i = 0; i < all.length; i++) {
      const reservation = all[i];

      // const place = await findPlace(reservation.ID, reservation.category);

      // if (!place) {
      //   console.log(`place ${reservation.ID} not found`);
      // }

      // reservation.name = place.name;
      // await reservation.save();

      console.log(`Name: ${reservation.name} [${i}]`);

      // item.rank = i + 1;
      // await item.save();

      // console.log(`${item.name} ranked: ${item.rank}`);
    }

    console.log(`Update complete`);
  })
  .catch((err) => console.error(err));
