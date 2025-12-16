import redis from "../../database/redisClient.js";
import prisma from "../../database/prismaClient.js";
// Wallet
export const findWalletByUserId = async (userId) => {
  return prisma.wallet.findUnique({ where: { userId } });
};

export const createWalletForUser = async (userId) => {
  return prisma.wallet.create({
    data: { userId, balance: BigInt(0) },
  });
};

export const updateWalletBalance = async (userId, newBalance) => {
  return prisma.wallet.update({
    where: { userId },
    data: { balance: BigInt(newBalance) }, // expect BigInt or string -> Prisma will accept BigInt
  });
};

// Ledger
export const createLedgerEntry = async (data) => {
  return prisma.ledger.create({ data });
};

export const getLedgerByUser = async (userId, { skip = 0, take = 50 } = {}) => {
  return prisma.ledger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
};
export const getWalletBalanceCached = async (userId) => {
  const cacheKey = `wallet:balance:${userId}`;
  let cached = await redis.get(cacheKey);

  if (cached) return BigInt(cached); // return from Redis

  // No cache → fetch DB
  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) return 0n;

  // Store in Redis
  await redis.set(cacheKey, wallet.balance.toString());
  return wallet.balance;
};
