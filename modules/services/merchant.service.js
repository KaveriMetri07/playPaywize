import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import {
  createUser,
  findUserByEmail,
  storeRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
} from "../repository/merchant.repository.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import redis from "../../database/redisClient.js";

const SALT_ROUNDS = 10;
export const registerUser = async ({
  name,
  email,
  password,
  role,
  businessName,
}) => {
  const existing = await findUserByEmail(email.toLowerCase());
  if (existing) {
    const err = new Error("User with this email already exists");
    err.status = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({
    name,
    email: email.toLowerCase(),
    password: hashed,
    role,
    businessName,
  });

  // create tokens
  const payload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ ...payload, tokenId: uuidv4() });
  // store refresh token with expiry
  const decoded = new Date(
    Date.now() + msToMillis(process.env.JWT_REFRESH_EXPIRES_IN || "30d")
  );
  // but we cannot parse durations reliably here; instead set expiresAt = now + 30 days
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await storeRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt,
  });

  return { user, accessToken, refreshToken };
};

export const loginUser = async ({ email, password }) => {
  const redisKey = `login-attempts:${email}`;

  let attempts = await redis.get(redisKey);
  attempts = attempts ? Number(attempts) : 0;
  if (attempts > 5) {
    return { status: false, msg: "Too many attempts try after  5min" };
  }

  const user = await findUserByEmail(email.toLowerCase());
  if (!user) {
    await redis.incr(redisKey);
    await redis.expire(redisKey, 300);
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    await redis.incr(redisKey);
    await redis.expire(redisKey, 300);
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }
  const payload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ ...payload, tokenId: uuidv4() });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await storeRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt,
  });

  return { user, accessToken, refreshToken };
};
export const refreshAuth = async (refreshToken) => {
  if (!refreshToken) {
    const err = new Error("Refresh token required");
    err.status = 401;
    throw err;
  }
  const stored = await findRefreshToken(refreshToken);
  if (!stored || stored.revoked) {
    const err = new Error("Invalid refresh token");
    err.status = 401;
    throw err;
  }

  // verify signature
  let decoded;
  try {
    decoded = await import("jsonwebtoken").then(({ default: jwt }) =>
      jwt.verify(refreshToken, process.env.JWT_SECRET)
    );
  } catch (e) {
    const err = new Error("Invalid refresh token");
    err.status = 401;
    throw err;
  }
  const payload = { userId: decoded.userId, email: decoded.email };
  const accessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken({ ...payload, tokenId: uuidv4() });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // revoke old token and store new
  await revokeRefreshToken(refreshToken);
  await storeRefreshToken({
    token: newRefreshToken,
    userId: decoded.userId,
    expiresAt,
  });

  return { accessToken, refreshToken: newRefreshToken };
};

function msToMillis() {
  // placeholder — we used a fixed 30 days above
  return 30 * 24 * 60 * 60 * 1000;
}
