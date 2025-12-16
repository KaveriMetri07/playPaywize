import express from "express";
import auth from "../../middleware/auth.js";
import * as ctrl from "../controllers/wallet.controller.js";

const router = express.Router();

// Protected routes
router.post("/wallet/credit", auth, ctrl.credit); // usually admin or system - but protected
router.post("/wallet/debit", auth, ctrl.debit); // payout request
router.get("/wallet/balance", auth, ctrl.balance);
router.get("/wallet/ledger", auth, ctrl.ledgerHistory);

export default router;
