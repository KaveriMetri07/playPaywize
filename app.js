import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import indexRouter from "./modules/routes/index.js";
import errorHandler from "./middleware/errorHandler.js";
import redis from "./database/redisClient.js";
import swaggerui from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { serverAdapter } from "./bullmq/bull-board.js";
import { tryCatch } from "bullmq";
import prisma from "./database/prismaClient.js";
import { timeStamp } from "console";

const app = express();

const __dirname = path.resolve();

const swaggerDocument = YAML.load(
  path.join(__dirname, "./swagger/swagger.yml")
);
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api-docs", swaggerui.serve, swaggerui.setup(swaggerDocument));
app.use("/admin/queues", serverAdapter.getRouter());

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    return res.status(200).json({
      status: "ok",
      service: "playpaywize-backend",
      db: "up",
      redis: "up",
      timeStamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: "down",
      error: error.message,
      timeStamp: new Date().toISOString(),
    });
  }
});

app.use("/api/v1/", indexRouter);
app.get("/hello", (req, res) => {
  res.send("hello spoorti");
});

app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log("Bull Board ready at http://localhost:5000/admin/queues");
});

export default app;
