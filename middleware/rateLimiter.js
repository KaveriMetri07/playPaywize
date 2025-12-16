import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../database/redisClient.js";
import logger from "../logger/index.loger.js";

const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,

  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),

  handler: (req, res) => {
    logger.warn("Too many attempts");
    res.status(429).json({
      success: false,
      message: "TOO many requests. please try again later.",
    });
  },
});
export default apiRateLimiter;
