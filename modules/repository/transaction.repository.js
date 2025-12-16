import prisma from "../../database/prismaClient.js";

export const createTransaction = (data) => {
  return prisma.transaction.create({ data });
};
export const findReceiver = (customerId) => {
  return prisma.user.findFirst({
    where: {
      id: customerId,
      role: "CUSTOMER",
    },
  });
};

export const updateTransactionStatus = (transactionId, status) => {
  return prisma.transaction.update({
    where: { id: transactionId },
    data: { status },
  });
};
export const getAllTransaction = () => {
  return prisma.transaction.findMany();
};

export const getSuccessTrans = (SUCCESS) => {
  return prisma.transaction.findMany({
    where: { status: SUCCESS },
  });
};
export const getFailedTrans = (FAILED) => {
  return prisma.transaction.findMany({
    where: { status: FAILED },
  });
};

export const getTransactionByLimitSkip = (skip, limit, whereClause) => {
  console.log("am in repo of pagination");
  return prisma.transaction.findMany({
    where: whereClause,
    skip: skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
};
export const countTransactions = () => {
  return prisma.transaction.count({
    //where: whereClause,
  });
};

export const getTransactionStats_repo = (whereClause) => {
  return prisma.transaction.aggregate({
    where: whereClause,
    _sum: { amount: true },
    _avg: { amount: true },
  });
};
