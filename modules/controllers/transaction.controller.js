import { findReceiver } from "../repository/transaction.repository.js";
import {
  getAllTransaction_Services,
  getFailedTrans_service,
  getSuccessTrans_Services,
  getTransactionByLimit_service,
  getTransactionStats_service,
  startTransactionService,
} from "../services/transaction.service.js";
import { convertBigInt } from "../../utils/bigInt_parser.js";
import { getBalance, toPaise } from "../services/wallet.service.js";
import logger from "../../logger/index.loger.js";

export const startTransaction = async (req, res) => {
  try {
    const userId = req.user.id; // ← from JWT token middleware

    const { customerId, amount, remarks } = req.body;
    if (req.user.role !== "MERCHANT") {
      return res
        .status(403)
        .json({ message: "Only merchants can initiate transactions" });
    }
    if (!customerId || !amount) {
      return res.status(400).json({ message: "CustomerId & amount required" });
    }

    const amountPaise = toPaise(amount);
    if (amountPaise <= 0n) {
      return res.status(400).json({
        message: "Amount must be greater than zero",
      });
    }
    const merchantWallet = await getBalance(userId);
    if (!merchantWallet) {
      return res.status(404).json({
        message: "Merchant wallet not found",
      });
    }

    if (merchantWallet < amountPaise) {
      return res.status(400).json({
        message: "Insufficient wallet balance",
      });
    }

    const receiverId = await findReceiver(customerId);

    if (!receiverId) {
      return res.status(404).json({ msg: "Customer is not found " });
    }

    const txn = await startTransactionService(
      userId,
      customerId,
      amount,
      remarks
    );

    const safeTxn = {
      ...txn,
      amount: (Number(txn.amount) / 100).toString(),
      createdAt: txn.createdAt,
      updatedAt: txn.updatedAt,
    };

    res.status(201).json({
      message: "Transaction executed",
      transaction: safeTxn,
    });
  } catch (err) {
    res.status(500).json({
      message: "Transaction failed",
      error: err.message,
    });
  }
};

export const getTransaction = async (req, res) => {
  try {
    const { filterVariable } = req.query;
    console.log(filterVariable);
    if (filterVariable && filterVariable === "SUCCESS") {
      const result = await getSuccessTrans_Services(filterVariable);
      if (!result) {
        return res
          .status(404)
          .json({ message: "There arent any success transaction" });
      }
      const getSTX = convertBigInt(result);
      return res
        .status(200)
        .json({ message: "SUCCESS Transactions fetched successfully", getSTX });
    } else if (filterVariable && filterVariable === "FAILED") {
      const failedResult = await getFailedTrans_service(filterVariable);
      if (!failedResult) {
        return res
          .status(404)
          .json({ message: "There arent any failed transaction" });
      }
      const getFTX = convertBigInt(failedResult);
      return res.status(200).json({
        message: "FAILED Transactions fetched successfully",
        getFTX,
      });
    }
    const getALLtrans = await getAllTransaction_Services();
    if (!getALLtrans) {
      return res.status(204).json({ message: "no content to display" });
    }
    const getTx = convertBigInt(getALLtrans);
    return res
      .status(200)
      .json({ message: "all transactions fetched successfully", getTx });
  } catch (error) {
    console.log(`error in getting transactions`, error);
    return res.status(500).json({ error: "Internal error", error });
  }
};

export const getTransactionByLimit = async (req, res) => {
  try {
    let pageNum = req.query.page;
    let limitNum = req.query.limit;
    const filter = req.query.date; //today||yesterday||lastmonth||last7days
    console.log(`filter=${filter}`);
    console.log(`pagenum= ${pageNum} limitnum = ${limitNum}`);
    const page = pageNum ? Number(pageNum) : 1;
    const limit = limitNum ? Number(limitNum) : 5;
    if (page < 1 || limit < 1) {
      return res
        .status(400)
        .json({ msg: "page and limit must be greater than 0" });
    }
    const skip = (page - 1) * limit;
    const result = await getTransactionByLimit_service(
      page,
      limit,
      skip,
      filter
    );

    if (result.page_limit_trans == 0) {
      return res.status(404).json({ msg: "No transaction found" });
    }
    const records = convertBigInt(result.page_limit_trans);
    const total = result.totalCOunt;
    const totalPg = result.totalPage;
    return res.status(200).json({
      msg: "fetched successfully",
      total,
      page,
      limit,
      totalPg,
      records,
    });
  } catch (error) {
    console.log("could get transaction using limit", error);
    res.status(500).json({ msg: "Internal error" });
  }
};

export const getTransactionStats = async (req, res) => {
  try {
    let userId;
    const date = req.query.date;

    if (req.user.role === "ADMIN") {
      userId = req.query.userId;
      if (!userId) {
        return res
          .status(400)
          .json({ msg: "ADMIN must provide userId in query parameter" });
      }
    } else {
      userId = req.user.id;
    }
    const stats = convertBigInt(
      await getTransactionStats_service(userId, date)
    );

    if (!stats) {
      return res.status(204).json({
        msg: "stats",
        totalAmount: stats._sum.amount ?? 0,
        averageAmount: stats._avg.amount ?? 0,
      });
    }
    return res.status(200).json({ msg: "fetched stats successfully", stats });
  } catch (error) {
    console.log(`error= ${error}`);
    return res.status(500).json({ msg: "INTERNAL ERROR" });
  }
};
