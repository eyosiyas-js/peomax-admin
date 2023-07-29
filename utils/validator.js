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

const supervisorSchema = Joi.object({
  firstName: Joi.string().trim().pattern(namePattern).required().messages({
    "string.pattern.base": "firstName must contain only alphabetic characters",
  }),
  lastName: Joi.string().trim().pattern(namePattern).required().messages({
    "string.pattern.base": "lastName must contain only alphabetic characters",
  }),
  email: Joi.string().trim().email().required(),
  password: passwordComplexity(complexityOptions),
  confirmPassword: passwordComplexity(complexityOptions),
});

const employeeSchema = Joi.object({
  firstName: Joi.string().trim().pattern(namePattern).required().messages({
    "string.pattern.base": "firstName must contain only alphabetic characters",
  }),
  lastName: Joi.string().trim().pattern(namePattern).required().messages({
    "string.pattern.base": "lastName must contain only alphabetic characters",
  }),
  email: Joi.string().trim().email().required(),
  password: passwordComplexity(complexityOptions),
  confirmPassword: passwordComplexity(complexityOptions),
  ID: Joi.string().required(),
  category: Joi.string().valid("bar", "club", "hotel", "restaurant").required(),
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
  paymentOptions: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .required(),
  additional: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  website: Joi.string().required(),
  subHotel: Joi.string().optional(),
});

const editDinningPlaceSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  location: Joi.string().optional(),
  availableSpots: Joi.number().integer().optional(),
  totalSpots: Joi.number().integer().optional(),
  openingTime: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)\s(AM|PM)$/)
    .optional()
    .messages({
      "string.pattern.base": `Time should be in the format 0:00 PM`,
    }),
  closingTime: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)\s(AM|PM)$/)
    .optional()
    .messages({
      "string.pattern.base": `Time should be in the format 0:00 PM`,
    }),
  crossStreet: Joi.string().optional(),
  neighborhood: Joi.string().optional(),
  cuisines: Joi.string().optional(),
  diningStyle: Joi.string().optional(),
  dressCode: Joi.string().optional(),
  parkingDetails: Joi.string().optional(),
  publicTransit: Joi.string().optional(),
  paymentOptions: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .required(),
  additional: Joi.string().optional(),
  phoneNumber: Joi.string().optional(),
  website: Joi.string().optional(),
});

const eventSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  category: Joi.string().valid("bar", "club", "hotel", "restaurant").required(),
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
  premiumPrice: Joi.number().positive().optional(),
  totalSpots: Joi.number().positive().required(),
  images: Joi.array().optional(),
  program: Joi.string().valid("true", "false").optional(),
});

const editEventSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  date: Joi.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/)
    .optional()
    .messages({
      "string.pattern.base": `Date should be in the format mm/dd/yyyy`,
    }),
  eventStart: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)\s(AM|PM)$/)
    .optional()
    .messages({
      "string.pattern.base": `Time should be in the format 0:00 PM`,
    }),
  eventEnd: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)\s(AM|PM)$/)
    .optional()
    .messages({
      "string.pattern.base": `Time should be in the format 0:00 PM`,
    }),
  price: Joi.number().positive().optional(),
  premiumPrice: Joi.number().positive().optional(),
  totalSpots: Joi.number().positive().optional(),
  images: Joi.array().optional(),
  program: Joi.string().valid("true", "false").optional(),
});

const reservationSchema = Joi.object({
  ID: Joi.string().required(),
  people: Joi.number().integer().min(1).required(),
  category: Joi.string().valid("bar", "club", "restaurant").required(),
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
  phoneNumber: Joi.string().optional(),
});

const menuSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  ID: Joi.string().required(),
  category: Joi.string().valid("bar", "club", "restaurant").required(),
  group: Joi.string().required(),
  fasting: Joi.boolean().optional(),
  price: Joi.number().integer().required(),
});

function validateSignupData(data) {
  const output = userSignupSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replace(/"/g, ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

function validateLoginData(data) {
  const output = userLoginSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replace(/"/g, ""),
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
      message: error.details[0].message.replace(/"/g, ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

function validateSupervisor(data) {
  const output = supervisorSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replace(/"/g, ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

function validateEmployee(data) {
  const output = employeeSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replace(/"/g, ""),
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
      message: error.details[0].message.replace(/"/g, ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

function validateEditDiningPlace(data) {
  const output = editDinningPlaceSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replace(/"/g, ""),
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
      message: error.details[0].message.replace(/"/g, ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

function validateEditEvent(data) {
  const output = editEventSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replace(/"/g, ""),
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
      message: error.details[0].message.replace(/"/g, ""),
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
      message: error.details[0].message.replace(/"/g, ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

function validateMenu(data) {
  const output = menuSchema.validate(data);
  const { error } = output;

  if (error) {
    return {
      success: false,
      message: error.details[0].message.replace(/"/g, ""),
    };
  } else {
    return { success: true, message: "Validation successful" };
  }
}

module.exports = {
  validateSignupData,
  validateLoginData,
  validateManagerSignupData,
  validateSupervisor,
  validateEmployee,
  validateReservation,
  validateDiningPlace,
  validateTicket,
  validateEvent,
  validateEditDiningPlace,
  validateEditEvent,
  validateMenu,
};
