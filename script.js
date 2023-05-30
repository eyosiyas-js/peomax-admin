const mongoose = require("mongoose");
const Hotel = require("./models/Hotel"); // Assuming the schema is defined in a separate file called "hotelModel.js"

require("dotenv").config();

mongoose.set("strictQuery", false);

const mongo_url = process.env.mongo_url;

mongoose.set("strictQuery", false);
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      const hotels = await Hotel.find(); // Retrieve all hotels

      hotels.forEach(async (hotel) => {
        hotel.ID = hotel.hotelID; // Assign the value of hotelID to ID
        hotel.hotelID = undefined; // Remove the hotelID field
        await hotel.save(); // Save the updated hotel document
      });

      console.log("Hotel IDs updated successfully!");
    } catch (error) {
      console.error("Error updating hotel IDs:", error);
    } finally {
      mongoose.disconnect(); // Close the database connection
    }
  })
  .catch((err) => console.error(err));
