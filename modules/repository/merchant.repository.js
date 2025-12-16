import prisma from "../../database/prismaClient.js";

export const createUser = async (data) => {
  return prisma.user.create({ data });
};

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({ where: { id } });
};

export const storeRefreshToken = async ({ token, userId, expiresAt }) => {
  return prisma.refreshToken.create({ data: { token, userId, expiresAt } });
};

export const revokeRefreshToken = async (token) => {
  return prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });
};

export const findRefreshToken = async (token) => {
  return prisma.refreshToken.findUnique({ where: { token } });
};

export const updateUser = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

export const updateUserPassword = async (id, hashedPassword) => {
  return prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });
};
