import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import {
  crearApiKeyService,
  listarApiKeysService,
  revocarApiKeyService,
} from "./apiKeys.service.js";

export const listarApiKeysController = asyncHandler(async (req, res) => {
  const apiKeys = await listarApiKeysService(req.tenant.id_empresa);
  return successResponse(res, "API keys obtenidas correctamente", apiKeys);
});

export const crearApiKeyController = asyncHandler(async (req, res) => {
  const apiKey = await crearApiKeyService(req.tenant.id_empresa, req.body, req.user);
  return successResponse(
    res,
    "API key creada correctamente. Guarda el valor porque no se volvera a mostrar.",
    apiKey,
    201
  );
});

export const revocarApiKeyController = asyncHandler(async (req, res) => {
  const apiKey = await revocarApiKeyService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.user
  );
  return successResponse(res, "API key revocada correctamente", apiKey);
});
