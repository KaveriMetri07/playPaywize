import express from "express";
import * as ctrl from "../controllers/transaction.controller.js";
import auth from "../../middleware/auth.js";

const router = express();

router.post("/init_Transaction", auth, ctrl.startTransaction);
router.get("/get_Transaction", ctrl.getTransaction);
router.get("/getTransactionByLimit", ctrl.getTransactionByLimit);
router.get("/transactionStats", auth, ctrl.getTransactionStats);

export default router;
