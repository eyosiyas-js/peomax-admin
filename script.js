const mongoose = require("mongoose");
const Item = require("./models/");
const dotenv = require("dotenv");
dotenv.config();

const data = require(`./compass/${Item.modelName.toLocaleLowerCase()}s.json`);

const mongo_url = process.env.mongo_url;

mongoose.set("strictQuery", false);
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("MongoDB connected!");

    const items = data;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await new Item(item).save();
      console.log(`Item: ${i + 1}`);
    }

    console.log(`Update complete`);
  })
  .catch((err) => console.error(err));
