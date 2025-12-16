// src/modules/merchant/merchant.profile.routes.js
import express from "express";
import auth from "../../middleware/auth.js";
import * as ctrl from "../controllers/merchant.profile.controller.js";
import { authorize } from "../../middleware/authorize.js";

const router = express.Router();

// All routes here are protected
router.get("/profile", auth, authorize("MERCHANT", "CUSTOMER"), ctrl.profile);
router.put("/profile", auth, authorize("ADMIN"), ctrl.update);
router.put("/change-password", auth, ctrl.changePwd);

export default router;
