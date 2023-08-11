const Reservation = require("../models/Reservation");

async function availableSpots(date, place) {
  try {
    const reservationAggregation = await Reservation.aggregate([
      {
        $match: {
          ID: place.ID,
          category: place.category,
          date: date,
          status: { $nin: ["rejected", "attended"] },
        },
      },
      {
        $group: {
          _id: null,
          totalPeople: { $sum: "$people" },
        },
      },
    ]);

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
