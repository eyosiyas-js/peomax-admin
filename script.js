const mongoose = require("mongoose");
const Club = require("./models/Club.js");

require("dotenv").config();

const mongo_url = process.env.mongo_url;

mongoose.set("strictQuery", false);
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      const restaurants = await Club.find({}); // Retrieve all restaurants

      for (let i = 0; i < restaurants.length; i++) {
        const restaurant = restaurants[i]; // Convert the object to a Mongoose document
        restaurantObj = restaurant.toObject();
        restaurant.ID = restaurantObj.restaurantID; // Assign the value of restaurantID to ID
        restaurant.restaurantID = undefined; // Remove the restaurantID field
        await restaurant.save(); // Save the updated restaurant document
        console.log(`${restaurant.restaurantID} updated`);
      }

      console.log("Club IDs updated successfully!");
    } catch (error) {
      console.error("Error updating restaurant IDs:", error);
    } finally {
      mongoose.disconnect(); // Close the database connection
    }
  })
  .catch((err) => console.error(err));
