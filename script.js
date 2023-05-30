const mongoose = require("mongoose");
const Hotel = require("./models/Hotel"); // Assuming the schema is defined in a separate file called "hotelModel.js"

require("dotenv").config();

const mongo_url = process.env.mongo_url;

mongoose.set("strictQuery", false);
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    Hotel.updateMany(
      {},
      { $rename: { hotelID: "ID" } },
      { multi: true },
      function (err, blocks) {
        if (err) {
          throw err;
        }
        console.log("done!");
      }
    );
  })
  .catch((err) => console.error(err));
