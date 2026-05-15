import { AppError } from "./AppError.js";

const limitLabels = {
  max_sucursales: "sucursales",
  max_habitaciones: "habitaciones",
  max_usuarios: "usuarios",
  max_roles: "roles",
  max_modulos: "modulos activos",
  max_api_keys: "API keys",
};

const getOptionalLimitColumns = async (client) => {
  const result = await client.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'Empresa_limite'
    AND column_name = ANY($1);
    `,
    [["max_modulos", "max_api_keys"]]
  );

  return new Set(result.rows.map((row) => row.column_name));
};

export const getEmpresaLimites = async (client, id_empresa) => {
  const optionalColumns = await getOptionalLimitColumns(client);
  const maxModulosSelect = optionalColumns.has("max_modulos")
    ? "COALESCE(max_modulos, 999) AS max_modulos"
    : "999 AS max_modulos";
  const maxApiKeysSelect = optionalColumns.has("max_api_keys")
    ? "COALESCE(max_api_keys, 0) AS max_api_keys"
    : "0 AS max_api_keys";

  const result = await client.query(
    `
    SELECT
      max_sucursales,
      max_habitaciones,
      max_usuarios,
      max_roles,
      almacenamiento_gb,
      permite_bd_exclusiva,
      permite_dominio_propio,
      permite_api_externa,
      permite_offline,
      ${maxModulosSelect},
      ${maxApiKeysSelect}
    FROM "Empresa_limite"
    WHERE id_empresa = $1
    LIMIT 1;
    `,
    [id_empresa]
  );

  if (!result.rows[0]) {
    throw new AppError(
      "La empresa no tiene limites de plan configurados",
      403,
      { id_empresa },
      "PLAN_LIMITS_REQUIRED"
    );
  }

  return result.rows[0];
};

export const getEmpresaLimitesOrNull = async (client, id_empresa) => {
  try {
    return await getEmpresaLimites(client, id_empresa);
  } catch (error) {
    if (error.code === "PLAN_LIMITS_REQUIRED") {
      return null;
    }

    throw error;
  }
};

export const assertPlanLimit = async ({
  client,
  id_empresa,
  limitKey,
  countQuery,
  countParams = [],
}) => {
  const limites = await getEmpresaLimites(client, id_empresa);
  const limite = Number(limites[limitKey] ?? 0);

  const countResult = await client.query(countQuery, countParams);
  const total = Number(countResult.rows[0]?.total || 0);

  if (total >= limite) {
    throw new AppError(
      `Limite de ${limitLabels[limitKey] || limitKey} alcanzado. Tu plan permite ${limite}.`,
      403,
      {
        limit: limitKey,
        allowed: limite,
        current: total,
      },
      "PLAN_LIMIT_REACHED"
    );
  }

  return { total, limite, limites };
};

export const assertPlanFeature = async ({
  client,
  id_empresa,
  featureKey,
  message,
}) => {
  const limites = await getEmpresaLimites(client, id_empresa);

  if (!limites[featureKey]) {
    throw new AppError(
      message || "Esta caracteristica no esta incluida en el plan",
      403,
      { feature: featureKey },
      "PLAN_FEATURE_FORBIDDEN"
    );
  }

  return limites;
};
