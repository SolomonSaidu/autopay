import Joi from "joi";
import { registerSchema, loginSchema } from "../validator/userValidator.js";

const validatePayment = (req, res, next) => {
  const schema = Joi.object({
    amount: Joi.number().positive().required().messages({
      "number.positive": "Amount must be positive",
      "number.base": "Amount must be a valid number",
      "any.required": "Amount is required",
    }),
    scheduled_date: Joi.date().greater("now").required().messages({
      // "date.greater": "Schedule date must be in the feature",
      "any.required": "Schedule date is required",
    }),
    status: Joi.string()
      .valid("pending", "completed", "cancelled")
      .default("pending"),
    receiver_name: Joi.string().min(3).max(255).required().messages({
      "string.empty": "Name cant be empty",
      "string.min": "Invalid name, name is to short",
      "string.max": "Invalid name, name is to long",
      "any.required": "Name can't be empty",
    }),
    receiver_account: Joi.string().min(10).max(255).required().messages({
      "string.min": "Invalid account number",
      "string.max": "Invalid account number",
      "string.digits": "Account number must be a number",
      "any.required": "Account number can't be empty",
    }),
    description: Joi.string().required().messages({
      "any.required": "description can't be empty",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  next();
};

const validateUsers = (shema) => {
  return (req, res, next) => {
    const { error } = shema.validate(req.body);

    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }
    next();
  };
};

const validateAmount = (req, res, next) => {
  const schema = Joi.object({
    amount: Joi.number().positive().min(100).required().messages({
      "number.min": "Minimum top-up is 100 Naira",
      "number.positive": "Amount must be a positive number",
      "any.required": "Amount cannot be empty",
      "number.base": "Amount must be a number",
    }),
    type: Joi.string().required().messages({
      "string.empty": "Type cannot be empty",
      "string.base": "Type should be a text",
    }),
    category: Joi.string().required().messages({
      "string.empty": "Category cannot be empty",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  next();
};

export { validatePayment, validateUsers, validateAmount };
