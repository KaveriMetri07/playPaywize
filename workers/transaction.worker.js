import { Worker } from "bullmq";
import redis from "../database/redisClient.js";
import { parseBigIntFields } from "../utils/bigInt_parser.js";
import { updateTransactionStatus } from "../modules/repository/transaction.repository.js";
import {
  creditMoney,
  debitMoney,
  ensureWallet,
} from "../modules/services/wallet.service.js";

export const transactionWorker = new Worker(
  "transactionQueue",
  async (job) => {
    //console.log("processing job: ", job.id, job.data);

    const data = parseBigIntFields(job.data);
    const { txnId, userId, customerId, amountPaise } = data;

    const lockKey = `lock:wallet:${userId}`;

    try {
      await ensureWallet(customerId);
      await ensureWallet(userId);

      const acquired = await redis.set(lockKey, 1, { NX: true, Px: 5000 });
      if (!acquired) throw new Error("Wallet busy, try again.");

      await debitMoney({
        userId,
        amountPaise,
        source: "TRANSACTION",
        referenceId: txnId,
      });

      await creditMoney({
        customerId,
        amountPaise,
        source: "TRANSACTION",
        referenceId: txnId,
      });

      console.log("Transaction processed:", data);
      await redis.del(lockKey);

      return { status: "SUCCESS" };
    } catch (error) {
      await redis.del(lockKey);
      throw error;
    }
  },
  { connection: redis.options }
);

transactionWorker.on("active", async (job) => {
  await updateTransactionStatus(job.data.txnId, "PROCESSING");
});

transactionWorker.on("completed", async (job) => {
  await updateTransactionStatus(job.data.txnId, "SUCCESS");
});

transactionWorker.on("failed", async (job, err) => {
  await updateTransactionStatus(job.data.txnId, "FAILED");
});
