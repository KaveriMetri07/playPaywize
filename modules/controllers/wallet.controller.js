import redis from "../../database/redisClient.js";
import { getWalletBalanceCached } from "../repository/wallet.repository.js";
import {
  toPaise,
  toRupeesString,
  creditMoney,
  debitMoney,
  getBalance,
  getLedger,
  creditMoneyToOwn_service,
} from "../services/wallet.service.js";

export const credit = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { amount, source } = req.body;

    const amountPaise = toPaise(amount); // ₹ -> paise (integer)

    const { prevBalance, newBalance } = await creditMoneyToOwn_service({
      userId,
      amountPaise,
      source,
    });

    return res.json({
      message: "Credited successfully",
      prevBalance: toRupeesString(prevBalance),
      newBalance: toRupeesString(newBalance),
    });
  } catch (err) {
    next(err);
  }
};

export const debit = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { amount, source, referenceId } = req.body;
    const amountPaise = toPaise(amount);
    const { prevBalance, newBalance } = await debitMoney({
      userId,
      amountPaise,
      source,
      referenceId,
    });
    res.json({
      message: "Debited successfully",
      prevBalance: toRupeesString(prevBalance),
      newBalance: toRupeesString(newBalance),
    });
  } catch (err) {
    next(err);
  }
};

export const balance = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const balancePaise = await getWalletBalanceCached(userId);
    res.json({
      balance: toRupeesString(balancePaise),
      balancePaise: String(balancePaise),
    });
  } catch (err) {
    next(err);
  }
};

export const ledgerHistory = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { skip = 0, take = 50 } = req.query;
    const rows = await getLedger(userId, {
      skip: Number(skip),
      take: Number(take),
    });
    // convert amounts to rupees for response
    const mapped = rows.map((r) => ({
      id: r.id,
      amountPaise: String(r.amount),
      amount: Number(r.amount) / 100,
      type: r.type,
      source: r.source,
      referenceId: r.referenceId,
      balanceAfterPaise: String(r.balanceAfter),
      balanceAfter: Number(r.balanceAfter) / 100,
      createdAt: r.createdAt,
    }));
    res.json({ ledger: mapped });
  } catch (err) {
    next(err);
  }
};
export const getWalletBalance = async (req, res) => {
  const userId = req.user.id;

  // 1️⃣ get from redis cache
  const cached = await redis.get(`wallet:balance:${userId}`);
  if (cached) {
    return res.status(200).json({
      message: "Balance fetched from cache",
      balance: toRupeesString(BigInt(cached)),
    });
  }

  // 2️⃣ fallback to DB
  const balance = await getBalance(userId);

  // 3️⃣ update redis for next request
  await redis.set(`wallet:balance:${userId}`, balance.toString());

  return res.status(200).json({
    message: "Balance fetched from DB",
    balance: toRupeesString(balance),
  });
};
