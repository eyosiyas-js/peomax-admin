const mongoose = require("mongoose");
const Event = require("./models/Event");
const Ticket = require("./models/Ticket");
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
      const event = await Event.findOne({ eventID: ticket.eventID });

      ticket.ID = event.ID;
      ticket.category = event.category;

      await ticket.save();

      console.log(`ticket ${i} updated`);
    }

    console.log(`Update complete`);
  })
  .catch((err) => console.error(err));
