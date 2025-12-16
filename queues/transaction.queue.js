import { Queue } from "bullmq";
import redis from "../database/redisClient.js";

export const transactionQueue = new Queue("transactionQueue", {
  connection: redis.options,
  defaultJobOptions: {
    delay: 20000,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    // removeOnComplete: true,
    // removeOnFail: false,
  },
});
