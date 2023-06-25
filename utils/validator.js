const Joi = require("joi");

const reservationSchema = Joi.object({
  ID: Joi.string().required(),
  people: Joi.number().integer().min(1).required(),
  category: Joi.string().valid("hotel").required(),
  time: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)\s(AM|PM)$/)
    .required(),
  date: Joi.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/)
    .required(),
});

const isEmail = (email) => {
  const regEx =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

const isEmpty = (string) => {
  if (!string) return true;
  if (string.trim() === "") return true;
  else return false;
};

const isPhoneNumber = (str) => {
  const phoneRegex = /^(\+\d{1,3}\d{9}|\d{10})$/;
  return phoneRegex.test(str);
};

function validateSignupData({
  email,
  password,
  confirmPassword,
  firstName,
  lastName,
}) {
  let errors = {};

  if (isEmpty(email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(email)) {
    errors.email = "Invalid email address";
  } else if (isEmpty(firstName)) {
    errors.firstName = "firstName must not be empty";
  } else if (isEmpty(lastName)) {
    errors.firstName = "lastName must not be empty";
  } else if (isEmpty(confirmPassword)) {
    errors.confirmPassword = "confirm password must not be empty";
  } else if (isEmpty(password)) {
    errors.password = "Password must not be empty";
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

function validateReservation(data) {
  const output = reservationSchema.validate(data);
  const { error } = output;

  if (error) {
    return { success: false, message: error.details[0].message };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

module.exports = {
  validateSignupData,
  validateLoginData,
  isPhoneNumber,
  validateReservation,
};
