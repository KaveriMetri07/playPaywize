import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  errorFormat: "minimal", // 👌 optional safe config
  log: ["error", "warn"], // 👌 correct format
});

export default prisma;
