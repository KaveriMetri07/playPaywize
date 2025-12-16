import jwt from "jsonwebtoken";
import "dotenv/config";

const port = process.env.PORT || 5000;
const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const jwtAccessTTL = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const jwtRefreshTTL = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

export function signAccessToken(payload) {
  return jwt.sign(payload, jwtSecret, {
    expiresIn: jwtAccessTTL,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, jwtSecret, {
    expiresIn: jwtRefreshTTL,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}
