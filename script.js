const mongoose = require("mongoose");
const Item = require("./models/Ticket.js");

require("dotenv").config();

const mongo_url = process.env.mongo_url;

mongoose.set("strictQuery", false);
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      const items = await Item.find({});

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        itemObj = item.toObject();
        item.managerID = "23bcc06a43d2b554";
        await item.save();
        console.log(`Item ${items.indexOf(item)} updated`);
      }

      console.log("Items updated successfully!");
    } catch (error) {
      console.error("Error updating item IDs:", error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => console.error(err));
