import Joi from "joi";

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "any.required": "Name can't be empty",
    "string.min": "Name should be 3 character long",
    "string.max": "Invalid name",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "Eamil can't be empty",
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string().min(8).required().messages({
    "any.required": "Password can't be empty",
    "string.min": "Password should be 8 character long",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Eamil can't be empty",
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string().min(8).required().messages({
    "any.required": "Password can't be empty",
    "string.min": "Password should be 8 character long",
  }),
});

export { registerSchema, loginSchema };
