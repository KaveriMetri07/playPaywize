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

app.use("/api/v1/", indexRouter);

app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log("Bull Board ready at http://localhost:5000/admin/queues");
});

export default app;
