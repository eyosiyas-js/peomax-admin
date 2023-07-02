function checkAuthorization(userID, place) {
  if (place.employees !== [] && place.employees.includes(userID)) {
    return true;
  } else if (place.supervisors !== [] && place.supervisors.includes(userID)) {
    return true;
  } else if (place.managerID == userID) {
    return true;
  } else {
    return false;
  }
}

module.exports = checkAuthorization;
