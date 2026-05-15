import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { isSessionActive } from "../modules/auth/auth.model.js";

export const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Token no proporcionado", 401, null, "AUTH_TOKEN_MISSING");
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    const active = await isSessionActive(token);

    if (!active) {
      throw new AppError("Sesion expirada o revocada", 401, null, "AUTH_SESSION_REVOKED");
    }

    req.token = token;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Token invalido o expirado", 401, null, "AUTH_INVALID_TOKEN");
  }
};
