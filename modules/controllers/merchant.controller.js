import logger from "../../logger/index.loger.js";
import {
  registerUser,
  loginUser,
  refreshAuth,
} from "../services/merchant.service.js";

export const register = async (req, res, next) => {
  const { name, email, password, businessName, role } = req.body;
  logger.info("createUser_request", {
    name,
    email,
    businessName,
    role,
  });
  try {
    const { user, accessToken, refreshToken } = await registerUser({
      name,
      email,
      password,
      role,
      businessName,
    });

    logger.info("CreateUser_Success", { userId: user.id });
    res.cookie("jid", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.status(201).json({
      message: `${user.role} registered`,
      userId: user.id,
      accessToken,
    });
  } catch (err) {
    logger.error("createUser_failed", { email, error: err.message });
    next(err);
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    logger.info("login User", { email: email });
    const result = await loginUser({ email, password });
    if (result?.status === false) {
      return res.status(429).json({ message: result.msg });
    }
    if (!result) {
      logger.error("login failed"), { email: email };
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { user, accessToken, refreshToken } = result;

    res.cookie("jid", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    logger.info("login successful", { user: result.email });
    res.json({ message: "Logged in", userId: user.id, accessToken });
  } catch (err) {
    next(err);
    logger.error("internal error", { err });
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token =
      req.cookies?.jid ||
      req.body?.refreshToken ||
      req.headers["x-refresh-token"];
    const { accessToken, refreshToken } = await refreshAuth(token);
    res.cookie("jid", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token =
      req.cookies?.jid ||
      req.body?.refreshToken ||
      req.headers["x-refresh-token"];
    if (token) {
      await import("../repository/merchant.repository.js").then(
        ({ revokeRefreshToken }) => revokeRefreshToken(token)
      );
    }
    res.clearCookie("jid");
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};
