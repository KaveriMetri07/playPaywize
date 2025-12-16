import bcrypt from "bcryptjs";
import {
  findUserById,
  updateUser,
  updateUserPassword,
  findUserByEmail,
} from "../repository/merchant.repository.js";
import redis from "../../database/redisClient.js";

const SALT_ROUNDS = 10;

export const getProfile = async (userId) => {
  const redisUser = `Users:ID:${userId}`;
  const redisResult = await redis.get(redisUser);
  if (redisResult) {
    const parsed = JSON.parse(redisResult);
    const { password, ...safe } = parsed;
    console.log(safe);
    return safe;
  }
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error("user not found");
    err.status = 404;
    throw err;
  }
  const { password, ...safe } = user;
  await redis.set(redisUser, JSON.stringify(safe));
  // remove sensitive fields before returning (like password)

  return safe;
};

export const updateProfile = async (userId, payload) => {
  // allow update of name, businessName, maybe email (if you want, but usually email change needs verification)
  const allowed = {};
  if (payload.name !== undefined) allowed.name = payload.name;
  if (payload.businessName !== undefined)
    allowed.businessName = payload.businessName;

  const updatedUser = await updateUser(userId, allowed);
  await redis.set(`Users:ID:${userId}`, JSON.stringify(updatedUser));
  const { password, ...safe } = updatedUser;
  return safe;
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await findUserById(userId);

  if (!user) {
    const err = new Error("user not found");
    err.status = 404;
    throw err;
  }

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) {
    const err = new Error("Old password is incorrect");
    err.status = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await updateUserPassword(userId, hashed);

  return { message: "Password changed successfully" };
};
