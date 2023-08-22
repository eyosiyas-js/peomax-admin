const mongoose = require("mongoose");
const Item = require("./models/Ticket");
const dotenv = require("dotenv");
dotenv.config();

const items = require(`./${Item.modelName.toLocaleLowerCase()}s.json`);

const mongo_url = process.env.mongo_url;

mongoose.set("strictQuery", false);
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("MongoDB connected!");

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const createdAt = item.createdAt.$date;
      const dateString = createdAt;

      const datePart = new Date(dateString).toISOString().split("T")[0];
      const [year, month, day] = datePart.split("-");
      const formattedDate = `${month}/${day}/${year}`;

      item.date = formattedDate;
      item.createdAt = createdAt;
      delete item._id;
      delete item.createdAt;

      const ticket = new Item(item);
      await ticket.save();

      console.log(`Item: ${i + 1} updated`);
    }

    console.log(`Update complete`);
  })
  .catch((err) => console.error(err));
