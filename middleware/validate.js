import Joi from "joi";

export const validate = (schema) => {
  return (req, res, next) => {
    const options = { abortEarly: false, stripUnknown: true };
    const { error, value } = schema.validate(req.body, options);

    if (error) {
      const messages = error.details.map((err) => err.message);
      return res.status(400).json({ success: false, msg: messages });
    }

    req.body = value; // sanitized, safe data
    next();
  };
};
