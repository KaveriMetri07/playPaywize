import {
  countTransactions,
  createTransaction,
  getAllTransaction,
  getFailedTrans,
  getSuccessTrans,
  getTransactionByLimitSkip,
  getTransactionStats_repo,
  updateTransactionStatus,
} from "../repository/transaction.repository.js";
import {
  creditMoney,
  debitMoney,
  ensureWallet,
  toPaise,
} from "../services/wallet.service.js";
import { generateIRL } from "../../utils/irl.js";
import { getDateRange } from "../../utils/dateFilter.js";
import { transactionQueue } from "../../queues/transaction.queue.js";
import { convertBigInt } from "../../utils/bigInt_parser.js";
export const startTransactionService = async (
  userId,
  customerId,
  amount,
  remarks
) => {
  const irl = generateIRL();
  const amountPaise = toPaise(amount);
  const txn = await createTransaction({
    userId,
    receiverId: customerId,
    amount: amountPaise,
    irl,
    remarks,
    type: "DEBIT",
    status: "INITIATED",
  });
  await transactionQueue.add(
    "processTransaction",
    convertBigInt({ txnId: txn.id, userId, customerId, amountPaise })
  );

  return txn;
};

export const getAllTransaction_Services = async () => {
  try {
    const allTransaction = await getAllTransaction();
    return { allTransaction };
  } catch (error) {
    console.log(`error in fetching the transactions in services`);
    throw error;
  }
};

export const getSuccessTrans_Services = async (filterVariable) => {
  try {
    const successTrans = await getSuccessTrans(filterVariable);
    return { successTrans };
  } catch (error) {
    console.log(`error in fetching the Success transactions in services`);
    throw error;
  }
};

export const getFailedTrans_service = async (filterVariable) => {
  try {
    const failedTrans = await getFailedTrans(filterVariable);
    return { failedTrans };
  } catch (error) {
    console.log(`error in fetching the failed transactions in services`);
    throw error;
  }
};

export const getTransactionByLimit_service = async (
  page,
  limit,
  skip,
  filter
) => {
  try {
    //console.log("am in service of pagination");
    const dateRange = filter ? getDateRange(filter) : null;
    const whereClause = {
      ...(dateRange && {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      }),
    };
    const page_limit_trans = await getTransactionByLimitSkip(
      skip,
      limit,
      whereClause
    );
    const totalCOunt = await countTransactions();
    const totalPage = totalCOunt === 0 ? 0 : Math.ceil(totalCOunt / limit);
    return { totalCOunt, page_limit_trans, totalPage };
  } catch (error) {
    console.log(
      `error in fetching the transaction by skip and limit ,check in service`
    );
    throw error;
  }
};
export const getTransactionStats_service = async (userId, date) => {
  try {
    const dateRange = date ? getDateRange(date) : null;
    console.log(dateRange);
    const whereClause = {
      userId,
      ...(dateRange && {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      }),
    };

    const stats = await getTransactionStats_repo(whereClause);
    return stats;
  } catch (error) {
    console.log(`error in service of trans_stats ${error}`);
    throw error;
  }
};
