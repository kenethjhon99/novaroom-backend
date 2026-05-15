import { randomUUID } from "crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { registrarAuditoria } from "../../utils/audit.js";
import {
  createRefreshToken,
  createUserSession,
  findActiveRefreshToken,
  findUserByEmail,
  getUserContext,
  isSessionActive,
  revokeRefreshToken,
  revokeUserSession,
  updateLastLogin,
} from "./auth.model.js";

const durationToMs = (value) => {
  const match = String(value || "").trim().match(/^(\d+)(ms|s|m|h|d)$/);

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
};

const buildTokenPayload = (user) => ({
  id_usuario: user.id_usuario,
  uuid_usuario: user.uuid_usuario,
  id_empresa: user.id_empresa,
  id_sucursal: user.id_sucursal,
  tipo_usuario: user.tipo_usuario,
  email: user.email,
});

const issueTokens = async (user, meta = {}) => {
  const payload = buildTokenPayload(user);
  const token = jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
  const refreshToken = jwt.sign(
    { id_usuario: user.id_usuario, type: "refresh", jti: randomUUID() },
    env.jwt.secret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
  const refreshExpiresAt = new Date(
    Date.now() + durationToMs(env.jwt.refreshExpiresIn)
  );

  await createUserSession({
    id_usuario: user.id_usuario,
    token,
    ip: meta.ip,
    user_agent: meta.userAgent,
  });

  await createRefreshToken({
    id_usuario: user.id_usuario,
    refresh_token: refreshToken,
    expires_at: refreshExpiresAt,
    ip: meta.ip,
    user_agent: meta.userAgent,
  });

  return { token, refreshToken };
};

export const loginService = async ({ email, password }, meta = {}) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError("Credenciales invalidas", 401, null, "AUTH_INVALID_CREDENTIALS");
  }

  if (user.estado !== "ACTIVO") {
    throw new AppError("Usuario inactivo o bloqueado", 403, null, "AUTH_USER_INACTIVE");
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new AppError("Credenciales invalidas", 401, null, "AUTH_INVALID_CREDENTIALS");
  }

  await updateLastLogin(user.id_usuario);

  const { token, refreshToken } = await issueTokens(user, meta);

  const context = await getUserContext(user.id_usuario);

  await registrarAuditoria({
    id_empresa: user.id_empresa,
    id_sucursal: user.id_sucursal,
    id_usuario: user.id_usuario,
    modulo: "auth",
    tabla_afectada: "Sesion_usuario",
    accion: "LOGIN",
    descripcion: "Inicio de sesion",
    valores_nuevos: { email: user.email, tipo_usuario: user.tipo_usuario },
    meta,
  });

  return {
    token,
    refreshToken,
    user: context.user,
    roles: context.roles,
    permissions: context.permissions,
    modules: context.modules,
    sucursales: context.sucursales,
    limites: context.limites,
  };
};

export const refreshService = async ({ refresh_token }, meta = {}) => {
  let decoded;

  try {
    decoded = jwt.verify(refresh_token, env.jwt.secret);
  } catch {
    throw new AppError("Refresh token invalido o expirado", 401, null, "AUTH_INVALID_REFRESH_TOKEN");
  }

  if (decoded.type !== "refresh") {
    throw new AppError("Refresh token invalido", 401, null, "AUTH_INVALID_REFRESH_TOKEN");
  }

  const refreshRow = await findActiveRefreshToken(refresh_token);

  if (!refreshRow || Number(refreshRow.id_usuario) !== Number(decoded.id_usuario)) {
    throw new AppError("Refresh token revocado", 401, null, "AUTH_REFRESH_REVOKED");
  }

  if (refreshRow.estado !== "ACTIVO") {
    throw new AppError("Usuario inactivo o bloqueado", 403, null, "AUTH_USER_INACTIVE");
  }

  await revokeRefreshToken(refresh_token);

  const { token, refreshToken } = await issueTokens(refreshRow, meta);
  const context = await getUserContext(refreshRow.id_usuario);

  await registrarAuditoria({
    id_empresa: refreshRow.id_empresa,
    id_sucursal: refreshRow.id_sucursal,
    id_usuario: refreshRow.id_usuario,
    modulo: "auth",
    tabla_afectada: "Refresh_token",
    accion: "TOKEN_REFRESH",
    descripcion: "Renovacion de sesion",
    meta,
  });

  return {
    token,
    refreshToken,
    user: context.user,
    roles: context.roles,
    permissions: context.permissions,
    modules: context.modules,
    sucursales: context.sucursales,
    limites: context.limites,
  };
};

export const meService = async (user, token) => {
  if (token) {
    const active = await isSessionActive(token);

    if (!active) {
      throw new AppError("Sesion expirada o revocada", 401, null, "AUTH_SESSION_REVOKED");
    }
  }

  const context = await getUserContext(user.id_usuario);

  if (!context) {
    throw new AppError("Usuario no encontrado", 404, null, "AUTH_USER_NOT_FOUND");
  }

  return context;
};

export const logoutService = async (token, user = null, meta = {}) => {
  if (token) {
    await revokeUserSession(token);
  }

  if (meta.refreshToken) {
    await revokeRefreshToken(meta.refreshToken);
  }

  if (user) {
    await registrarAuditoria({
      id_empresa: user.id_empresa,
      id_sucursal: user.id_sucursal,
      id_usuario: user.id_usuario,
      modulo: "auth",
      tabla_afectada: "Sesion_usuario",
      accion: "LOGOUT",
      descripcion: "Cierre de sesion",
      meta,
    });
  }
};
