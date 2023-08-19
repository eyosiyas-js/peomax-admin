const mongoose = require("mongoose");
const Item = require("./models/User");
const dotenv = require("dotenv");
const User = require("./models/User");
dotenv.config();

// const data = require(`./compass/${Item.modelName.toLocaleLowerCase()}s.json`);

const mongo_url = process.env.mongo_url;

async function generateReference(usr) {
  const chars = "0123456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    const index = Math.floor(Math.random() * chars.length);
    random += chars[index];
  }
  let reference = `peo-${random}${usr.firstName[0].toLowerCase()}${usr.email[1].toLowerCase()}${usr.lastName[0].toLowerCase()}`;

  const referenceExists = await User.findOne({
    role: "client",
    reference: reference,
  });
  if (referenceExists) {
    return await generateReference(usr);
  } else {
    return reference;
  }
}

mongoose.set("strictQuery", false);
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("MongoDB connected!");

    const items = await Item.find({ role: "client" });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      item.reference = await generateReference(item);
      await item.save();
      console.log(`Item: ${i + 1} updated`);
    }

    console.log(`Update complete`);
  })
  .catch((err) => console.error(err));
