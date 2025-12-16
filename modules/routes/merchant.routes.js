import express from "express";
import * as controller from "../controllers/merchant.controller.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "../validations/user.validation.js";
import apiRateLimiter from "../../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), apiRateLimiter, controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);

export default router;
