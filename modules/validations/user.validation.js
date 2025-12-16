import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().min(3).max(40).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("CUSTOMER", "ADMIN", "MERCHANT").required(),

  businessName: Joi.string().min(3).when("role", {
    is: "MERCHANT",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});
