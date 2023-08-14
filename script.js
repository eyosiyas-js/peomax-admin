const mongoose = require("mongoose");
const User = require("./models/User");
const Hotel = require("./models/Hotel");
const Restaurant = require("./models/Restaurant");
const Bar = require("./models/Bar");
const Club = require("./models/Club");
const dotenv = require("dotenv");
dotenv.config();

const mongo_url = process.env.mongo_url;

mongoose.set("strictQuery", false);
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("MongoDB connected!");

    const [bars, clubs, hotels, restaurants] = await Promise.all([
      Bar.find({}),
      Club.find({}),
      Hotel.find({}),
      Restaurant.find({}),
    ]);

    const data = [...hotels, ...restaurants, ...clubs, ...bars];
    const all = data;
    // const all = data.sort((a, b) => a._rank - b._rank);
    console.log(all.length);

    for (let i = 0; i < all.length; i++) {
      const item = all[i];

      // item._rank = i + 1;
      // await item.save();

      console.log(`${item.name} is ranked: ${item._rank}`);
    }

    console.log(`Update complete`);
  })
  .catch((err) => console.error(err));
