const moment = require("moment");

function hasDatePassed(date1, date2) {
  let secondDate;

  if (date2) {
    secondDate = moment.tz(date2, "MM/DD/YYYY", "Africa/Nairobi");
  } else {
    secondDate = moment.tz("Africa/Nairobi");
  }

  const parsedDate1 = moment.tz(date1, "MM/DD/YYYY", "Africa/Nairobi");
  return parsedDate1.isSameOrBefore(secondDate, "day");
}

function hasTimePassed(firstTime, secondTime) {
  let secondMoment;

  if (secondTime) {
    secondMoment = moment.tz(secondTime, "hh:mm A", "Africa/Nairobi");
  } else {
    secondMoment = moment.tz(new Date(), "hh:mm A", "Africa/Nairobi");
  }

  const firstMoment = moment.tz(firstTime, "hh:mm A", "Africa/Nairobi");
  return firstMoment.isAfter(secondMoment);
}

module.exports = { hasDatePassed, hasTimePassed };
