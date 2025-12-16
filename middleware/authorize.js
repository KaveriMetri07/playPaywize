export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ msg: "Unauthorized" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          msg: "Forbiden:you do not have permission to access this resources",
        });
      }
      return next();
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Internal error", error });
    }
  };
