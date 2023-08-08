const mongoose = require("mongoose");
const Ticket = require("./models/Ticket");
const User = require("./models/User");
const dotenv = require("dotenv");
dotenv.config();

const mongo_url = process.env.mongo_url;

mongoose.set("strictQuery", false);
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("MongoDB connected!");

    const tickets = await Ticket.find({});

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const user = await User.findOne({ userID: ticket.userID });
      if (!user) {
        await ticket.remove();
      } else {
        ticket.firstName = user.firstName;
        ticket.lastName = user.lastName;
        ticket.email = user.email;
        ticket.phoneNumber = "+251 911 22 33 44";

        await ticket.save();
      }
      console.log(`ticket ${i} updated`);
    }
  })
  .catch((err) => console.error(err));
