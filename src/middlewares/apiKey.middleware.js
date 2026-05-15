import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { sha256 } from "../utils/crypto.js";

export const apiKeyMiddleware = async (req, res, next) => {
  const rawKey = req.headers["x-api-key"];

  if (!rawKey) {
    throw new AppError("API key requerida", 401, null, "API_KEY_REQUIRED");
  }

  const result = await query(
    `
    SELECT
      ak.id_api_key,
      ak.id_empresa,
      ak.nombre,
      ak.scopes,
      ak.activo,
      ak.expira_at,
      e.estado AS estado_empresa
    FROM "Api_key" ak
    INNER JOIN "Empresa" e ON e.id_empresa = ak.id_empresa
    WHERE ak.key_hash = $1
    LIMIT 1;
    `,
    [sha256(rawKey)]
  );

  const apiKey = result.rows[0];

  if (!apiKey || !apiKey.activo || apiKey.revoked_at) {
    throw new AppError("API key invalida", 401, null, "API_KEY_INVALID");
  }

  if (apiKey.expira_at && new Date(apiKey.expira_at) < new Date()) {
    throw new AppError("API key expirada", 401, null, "API_KEY_EXPIRED");
  }

  if (apiKey.estado_empresa !== "ACTIVA") {
    throw new AppError("Empresa inactiva", 403, null, "TENANT_FORBIDDEN");
  }

  await query(
    `UPDATE "Api_key" SET ultimo_uso_at = NOW() WHERE id_api_key = $1;`,
    [apiKey.id_api_key]
  );

  req.apiKey = apiKey;
  req.tenant = {
    id_empresa: apiKey.id_empresa,
    id_sucursal: null,
    isSuperAdmin: false,
    viaApiKey: true,
  };

  next();
};

export const requireApiScope = (scope) => {
  return (req, res, next) => {
    const scopes = req.apiKey?.scopes || [];

    if (!scopes.includes("*") && !scopes.includes(scope)) {
      throw new AppError("Scope de API insuficiente", 403, null, "API_SCOPE_FORBIDDEN");
    }

    next();
  };
};
