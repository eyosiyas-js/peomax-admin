const isEmail = (email) => {
  const regEx =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

const isPhoneNumber = (str) => {
  const phoneRegex = /^(\+\d{1,3}\d{9}|\d{10})$/;
  return phoneRegex.test(str);
};

function validateSignupData({
  email,
  phoneNumber,
  password,
  confirmPassword,
  firstName,
}) {
  let errors = {};

  if (isEmpty(email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(email)) {
    errors.email = "Invalid email address";
  } else if (isEmpty(firstName)) {
    errors.firstName = "firstName must not be empty";
  } else if (isEmpty(confirmPassword)) {
    errors.password = "confirm password must not be empty";
  } else if (isEmpty(password)) {
    errors.password = "Password must not be empty";
  } else if (isEmpty(phoneNumber)) {
    errors.phoneNumber = "Phone number must not be empty";
  } else if (!isPhoneNumber(phoneNumber)) {
    errors.phoneNumber = "Invalid phone number";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
}

function validateLoginData(data) {
  let errors = {};

  if (isEmpty(data.email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(data.email)) {
    errors.email = "Invalid email address";
  } else if (isEmpty(data.password)) {
    errors.password = "Password must not be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
}

module.exports = { validateSignupData, validateLoginData };
