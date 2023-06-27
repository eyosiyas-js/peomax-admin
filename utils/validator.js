const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const namePattern = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/;
const complexityOptions = {
  min: 8,
  max: 30,
  lowerCase: 1,
};

const userSignupSchema = Joi.object({
  firstName: Joi.string().trim().pattern(namePattern).required().messages({
    "string.pattern.base": "firstName must contain only alphabetic characters",
  }),
  lastName: Joi.string().trim().pattern(namePattern).required().messages({
    "string.pattern.base": "lastName must contain only alphabetic characters",
  }),
  password: passwordComplexity(complexityOptions),
  confirmPassword: passwordComplexity(complexityOptions),
  email: Joi.string().trim().email().required(),
  phoneNumber: Joi.string().trim().optional(),
});

const userLoginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string(),
});

const managerSignupSchema = Joi.object({
  name: Joi.string().trim().pattern(namePattern).required().messages({
    "string.pattern.base": "firstName must contain only alphabetic characters",
  }),
  password: passwordComplexity(complexityOptions),
  confirmPassword: passwordComplexity(complexityOptions),
  email: Joi.string().trim().email().required(),
});

const dinningPlaceSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  location: Joi.string().required(),
  availableSpots: Joi.number().integer().required(),
  totalSpots: Joi.number().integer().required(),
  openingTime: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)\s(AM|PM)$/)
    .required()
    .messages({
      "string.pattern.base": `Time should be in the format 0:00 PM`,
    }),
  closingTime: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)\s(AM|PM)$/)
    .required()
    .messages({
      "string.pattern.base": `Time should be in the format 0:00 PM`,
    }),

  crossStreet: Joi.string().required(),
  neighborhood: Joi.string().required(),
  cuisines: Joi.string().required(),
  diningStyle: Joi.string().required(),
  dressCode: Joi.string().required(),
  parkingDetails: Joi.string().required(),
  publicTransit: Joi.string().required(),
  paymentOptions: Joi.array().items(Joi.string()).required(),
  additional: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  website: Joi.string().required(),
});

const reservationSchema = Joi.object({
  ID: Joi.string().required(),
  people: Joi.number().integer().min(1).required(),
  category: Joi.string().valid("hotel").required(),
  time: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)\s(AM|PM)$/)
    .required()
    .messages({
      "string.pattern.base": `Time should be in the format 0:00 PM`,
    }),
  date: Joi.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": `Date should be in the format mm/dd/yyyy`,
    }),
});

const ticketSchema = Joi.object({
  eventID: Joi.string().required(),
  isPremium: Joi.boolean(),
  people: Joi.number().integer().required(),
});

function validateSignupData(data) {
  const output = userSignupSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replaceAll('"', ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

const eventSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  category: Joi.string()
    .valid("bar", "club", "hotel", "restaurant", "other")
    .required(),
  ID: Joi.string().required(),
  date: Joi.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": `Date should be in the format mm/dd/yyyy`,
    }),
  isFullDay: Joi.boolean().optional(),
  eventStart: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)\s(AM|PM)$/)
    .required()
    .messages({
      "string.pattern.base": `Time should be in the format 0:00 PM`,
    }),
  eventEnd: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)\s(AM|PM)$/)
    .required()
    .messages({
      "string.pattern.base": `Time should be in the format 0:00 PM`,
    }),
  price: Joi.number().positive().required(),
  premiumPrice: Joi.number().positive().required(),
});

function validateLoginData(data) {
  const output = userLoginSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replaceAll('"', ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

function validateManagerSignupData(data) {
  const output = managerSignupSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replaceAll('"', ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

function validateReservation(data) {
  const output = reservationSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replaceAll('"', ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

function validateTicket(data) {
  const output = ticketSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replaceAll('"', ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

function validateEvent(data) {
  const output = eventSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replaceAll('"', ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

function validateDiningPlace(data) {
  const output = dinningPlaceSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replaceAll('"', ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

module.exports = {
  validateSignupData,
  validateLoginData,
  validateManagerSignupData,
  validateReservation,
  validateDiningPlace,
  validateTicket,
  validateEvent,
};
