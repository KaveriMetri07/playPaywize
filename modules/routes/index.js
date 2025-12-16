import express from "express";
import transactionRouter from "./transaction.routes.js";
import merchantRoutes from "./merchant.routes.js";
import profileRoutes from "./merchant.profile.routes.js";
import walletRoutes from "./wallet.routes.js";
import rawSQLROutes from "./rawSQl.router.js";
const router = express();

router.use("/transaction", transactionRouter);
router.use("/user", merchantRoutes);
router.use("/user", profileRoutes);
router.use("/wallet", walletRoutes);
router.use("/rawClient", rawSQLROutes);
export default router;
