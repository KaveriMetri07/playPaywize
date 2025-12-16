// src/modules/merchant/merchant.profile.controller.js
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../services/merchant.profile.service.js";

export const profile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log(req.user);
    const data = await getProfile(userId);
    res.json({ user: data });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const userId = req.user.id;
    //const merchantId = req.merchant.merchantId;
    const payload = req.body;
    const updated = await updateProfile(userId, payload);
    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    next(err);
  }
};

export const changePwd = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      const err = new Error("oldPassword and newPassword are required");
      err.status = 400;
      throw err;
    }
    const result = await changePassword(userId, oldPassword, newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
