import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { registrarAuditoria } from "../../utils/audit.js";
import { createApiKey } from "../../utils/crypto.js";
import { assertPlanFeature, assertPlanLimit } from "../../utils/planLimits.js";
import { crearApiKey, listarApiKeys, revocarApiKey } from "./apiKeys.model.js";

export const listarApiKeysService = async (id_empresa) => listarApiKeys(id_empresa);

export const crearApiKeyService = async (id_empresa, data, user) => {
  return withTransaction(async (client) => {
    await assertPlanFeature({
      client,
      id_empresa,
      featureKey: "permite_api_externa",
      message: "El plan de la empresa no permite API externa",
    });

    await assertPlanLimit({
      client,
      id_empresa,
      limitKey: "max_api_keys",
      countQuery: `
        SELECT COUNT(*)::int AS total
        FROM "Api_key"
        WHERE id_empresa = $1
        AND activo = true;
      `,
      countParams: [id_empresa],
    });

    const generated = createApiKey();
    const apiKey = await crearApiKey(
      client,
      id_empresa,
      data,
      generated,
      user?.id_usuario
    );

    await registrarAuditoria({
      client,
      id_empresa,
      id_usuario: user?.id_usuario || null,
      modulo: "api_keys",
      tabla_afectada: "Api_key",
      id_registro: apiKey.id_api_key,
      accion: "API_KEY_CREADA",
      descripcion: "API key creada",
      valores_nuevos: { ...apiKey, key: undefined },
    });

    return {
      ...apiKey,
      key: generated.key,
    };
  });
};

export const revocarApiKeyService = async (uuid_api_key, id_empresa, user) => {
  const apiKey = await revocarApiKey(uuid_api_key, id_empresa);

  if (!apiKey) {
    throw new AppError("API key no encontrada", 404, null, "API_KEY_NOT_FOUND");
  }

  await registrarAuditoria({
    id_empresa,
    id_usuario: user?.id_usuario || null,
    modulo: "api_keys",
    tabla_afectada: "Api_key",
    id_registro: apiKey.id_api_key,
    accion: "API_KEY_REVOCADA",
    descripcion: "API key revocada",
    valores_nuevos: apiKey,
  });

  return apiKey;
};
