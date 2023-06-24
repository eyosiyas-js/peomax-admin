const mongoose = require("mongoose");
const Item = require("./models/Reservation");

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

        item.crossStreet = "Meskel Square";
        item.neighborhood = "Gurd Shola";
        item.cuisines = "Ethiopian";
        item.diningStyle = "Casual Dining";
        item.dressCode = "Business Casual";
        item.parkingDetails =
          "We recommend parking at Oosterdok parking garage. It takes abount 5 up to 10 minutes to walk to the restaurant";
        item.publicTransit =
          "Restaurant 1e Klas on platform 2B is always accessible, even without public transport card. The gates are open, and you can walk right in. Grand Café Restaurant 1e Klas is easily accessible by metro, tram, train, boat or bus - these almost literally stop at the door of the restaurant.";
        item.paymentOptions = ["oncash"];
        item.additional =
          "Gluten-free Options, Outdoor Smoking Area, Private Room, View, Wheelchair Access, Wine";

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
