const moment = require("moment-timezone");

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

function isTimeBetween(startTime, endTime, targetTime) {
  let targetMoment;

  if (targetTime) {
    targetMoment = moment.tz(targetTime, "hh:mm A", "Africa/Nairobi");
  } else {
    targetMoment = moment.tz(new Date(), "hh:mm A", "Africa/Nairobi");
  }

  const startMoment = moment.tz(startTime, "hh:mm A", "Africa/Nairobi");
  const endMoment = moment.tz(endTime, "hh:mm A", "Africa/Nairobi");

  if (endMoment.isBefore(startMoment)) {
    endMoment.add(1, "day");
  }

  return targetMoment.isBetween(startMoment, endMoment, null, "[]");
}

module.exports = { hasDatePassed, hasTimePassed, isTimeBetween };
