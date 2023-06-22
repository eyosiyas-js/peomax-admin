function checkAuthorization(userID, place) {
  if (
    (place.category == "hotel" && userID !== place.managerID) ||
    userID !== place.supervisorID ||
    userID !== place.employeeID
  ) {
    return false;
  }

  if (place.category !== "hotel" && userID !== place.managerID) {
    return false;
  }

  return true;
}

module.exports = checkAuthorization;
