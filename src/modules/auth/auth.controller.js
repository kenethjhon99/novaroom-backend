import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  loginService,
  logoutService,
  meService,
  refreshService,
} from "./auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const result = await loginService(req.body, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return successResponse(res, "Inicio de sesion correcto", result);
});

export const me = asyncHandler(async (req, res) => {
  const result = await meService(req.user, req.token);
  return successResponse(res, "Usuario autenticado", result);
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await refreshService(req.body, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return successResponse(res, "Sesion renovada correctamente", result);
});

export const logout = asyncHandler(async (req, res) => {
  await logoutService(req.token, req.user, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    refreshToken: req.body?.refresh_token,
  });
  return successResponse(res, "Sesion cerrada correctamente");
});
