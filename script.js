const mongoose = require("mongoose");
const Item = require("./models/Event");
const dotenv = require("dotenv");
dotenv.config();

// const items = require(`./${Item.modelName.toLocaleLowerCase()}s.json`);

const mongo_url = process.env.mongo_url;

mongoose.set("strictQuery", false);
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("MongoDB connected!");

    const items = await Item.find({});

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      item.endDate = item.date;
      await item.save();

      console.log(`Item: ${i + 1} updated`);
    }

    console.log(`Update complete`);
  })
  .catch((err) => console.error(err));
