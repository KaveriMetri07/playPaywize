import prisma from "../../database/prismaClient.js";
import redis from "../../database/redisClient.js";
import {
  findWalletByUserId,
  createWalletForUser,
  createLedgerEntry,
  updateWalletBalance,
  getLedgerByUser,
} from "../repository/wallet.repository.js";

// Helper: convert rupees (float or string) to paise (integer BigInt)
export const toPaise = (amountInRupees) => {
  // Accept number or string
  const rupees = Number(amountInRupees);
  if (Number.isNaN(rupees)) throw new Error("Invalid amount");
  // Avoid float issues by rounding to 2 decimals then *100
  return BigInt(Math.round(rupees * 100));
};

export const toRupeesString = (paiseBigInt) => {
  const p = BigInt(paiseBigInt);
  const sign = p < 0n ? "-" : "";
  const abs = p < 0n ? -p : p;
  const rupees = Number(abs / 100n);
  const cents = Number(abs % 100n);
  return `${sign}${rupees}.${cents.toString().padStart(2, "0")}`;
};

// Ensure wallet exists; returns wallet (object)
export const ensureWallet = async (userId) => {
  let wallet = await findWalletByUserId(userId);
  if (!wallet) {
    wallet = await createWalletForUser(userId);
  }
  return wallet;
};

/*
  creditMoney: credits (adds) amount to merchant wallet atomically.
  params:
    merchantId - string
    amountPaise - BigInt (paise)
    source - string (e.g. 'ADD_MONEY', 'REFUND')
    referenceId - optional
*/
export const creditMoney = async ({
  customerId,
  amountPaise,
  source = "CREDIT",
  referenceId = null,
  receiverWallet,
}) => {
  if (amountPaise <= 0n) throw new Error("amountPaise must be positive");
  //console.log(receiverWallet, typeof receiverWallet.userId);
  return prisma.$transaction(async (tx) => {
    // ensure wallet
    let wallet = await tx.wallet.findUnique({ where: { userId: customerId } });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { userId: customerId, balance: 0n },
      });
    }

    const prev = wallet.balance;
    const newBalance = prev + amountPaise;

    // create ledger entry
    await tx.ledger.create({
      data: {
        userId: customerId,
        amount: amountPaise,
        type: "CREDIT",
        source,
        referenceId,
        balanceAfter: newBalance,
      },
    });

    // update wallet
    await tx.wallet.update({
      where: { userId: customerId },
      data: { balance: newBalance },
    });
    await redis.set(`wallet:balance:${customerId}`, newBalance.toString());

    return { prevBalance: prev, newBalance };
  });
};

/*
  debitMoney: debits (subtracts) amount from wallet atomically.
  throws if insufficient balance.
  amountPaise must be positive BigInt representing rupees*100
*/
export const debitMoney = async ({
  userId,
  amountPaise,
  source = "PAYOUT",
  referenceId = null,
}) => {
  if (amountPaise <= 0n) throw new Error("amountPaise must be positive");

  return prisma.$transaction(async (tx) => {
    // ensure wallet
    let wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await tx.wallet.create({ data: { userId, balance: 0n } });
    }

    const prev = wallet.balance;
    if (prev < amountPaise) {
      const err = new Error("Insufficient balance");
      err.status = 400;
      throw err;
    }

    const newBalance = prev - amountPaise;

    // ledger entry
    await tx.ledger.create({
      data: {
        userId,
        amount: amountPaise,
        type: "DEBIT",
        source,
        referenceId,
        balanceAfter: newBalance,
      },
    });

    // update wallet
    await tx.wallet.update({
      where: { userId },
      data: { balance: newBalance },
    });
    await redis.set(`wallet:balance:${userId}`, newBalance.toString());

    return { prevBalance: prev, newBalance };
  });
};

export const getBalance = async (userId) => {
  const wallet = await ensureWallet(userId);
  return wallet.balance; // BigInt (paise)
};

export const getLedger = async (userId, opts) => {
  return getLedgerByUser(userId, opts);
};

export const creditMoneyToOwn_service = async ({
  userId,
  amountPaise,
  source = "CREDIT",
}) => {
  if (amountPaise <= 0n) throw new Error("amountPaise must be positive");

  // 1. Find wallet
  let wallet = await findWalletByUserId(userId);

  // 2. If no wallet exists, create it
  if (!wallet) {
    wallet = await createWalletForUser(userId);
  }

  const prevBalance = wallet.balance;
  const newBalance = prevBalance + amountPaise;

  // 3. Update wallet balance
  await updateWalletBalance(userId, newBalance);

  // 4. Add ledger entry
  await createLedgerEntry({
    userId,
    amount: amountPaise,
    type: "CREDIT",
    source,
    referenceId: `${Date.now()}`, // or from request
    balanceAfter: newBalance,
  });

  return { prevBalance, newBalance };
};
