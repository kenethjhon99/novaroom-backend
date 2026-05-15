import { AppError } from "../utils/AppError.js";

export const requireSuperAdmin = (req, res, next) => {
  if (req.tenant?.isSuperAdmin && req.user?.tipo_usuario === "SUPER_ADMIN") {
    return next();
  }

  throw new AppError(
    "Solo el superadmin puede acceder a esta seccion",
    403,
    null,
    "SUPER_ADMIN_REQUIRED"
  );
};
