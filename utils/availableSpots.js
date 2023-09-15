const Reservation = require("../models/Reservation");
const Ticket = require("../models/Ticket");

async function availableSpots(date, place, type) {
  try {
    const matchQuery = {
      ID: place.ID,
      category: place.category,
    };

    let aggregationPipeline = [
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: null,
          totalPeople: { $sum: "$people" },
        },
      },
    ];

    if (type === "event") {
      matchQuery.expired = { $ne: true };
      matchQuery.attended = { $ne: true };
      matchQuery.bookedDate = date;
    } else {
      matchQuery.status = { $nin: ["rejected", "attended"] };
      matchQuery.date = date;
    }

    const reservationAggregation = await (type === "event"
      ? Ticket.aggregate(aggregationPipeline)
      : Reservation.aggregate(aggregationPipeline));

    const sumOfPeople = reservationAggregation.length
      ? reservationAggregation[0].totalPeople
      : 0;

    return place.totalSpots - sumOfPeople;
  } catch (error) {
    console.error("Error retrieving reservations:", error);
    throw error;
  }
}

module.exports = availableSpots;
