// src/middleware/auth.js
import { verifyToken } from "../utils/jwt.js";
import prisma from "../database/prismaClient.js";

export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const err = new Error("Authorization header missing");
      err.status = 401;
      throw err;
    }

    const token = authHeader.split(" ")[1];
    let payload;
    try {
      payload = verifyToken(token);
    } catch (e) {
      const err = new Error("Invalid or expired token");
      err.status = 401;
      throw err;
    }

    // payload should contain merchantId (we used { merchantId, email } when signing)
    if (!payload?.userId) {
      const err = new Error("Invalid token payload");
      err.status = 401;
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
    console.log(user);
    if (!user) {
      const err = new Error("User not found");
      err.status = 401;
      throw err;
    }

    // attach to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
