import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import {
  actualizarWebhookService,
  crearWebhookService,
  listarLogsIntegracionService,
  listarWebhooksService,
  probarWebhookService,
} from "./webhooks.service.js";

export const listarWebhooksController = asyncHandler(async (req, res) => {
  const webhooks = await listarWebhooksService(req.tenant.id_empresa);
  return successResponse(res, "Webhooks obtenidos correctamente", webhooks);
});

export const crearWebhookController = asyncHandler(async (req, res) => {
  const webhook = await crearWebhookService(req.tenant.id_empresa, req.body, req.user);
  return successResponse(
    res,
    "Webhook creado correctamente. Guarda el secreto porque no se volvera a mostrar.",
    webhook,
    201
  );
});

export const actualizarWebhookController = asyncHandler(async (req, res) => {
  const webhook = await actualizarWebhookService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.body,
    req.user
  );
  return successResponse(res, "Webhook actualizado correctamente", webhook);
});

export const probarWebhookController = asyncHandler(async (req, res) => {
  const entregas = await probarWebhookService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.body
  );
  return successResponse(res, "Prueba de webhook ejecutada", entregas);
});

export const listarLogsIntegracionController = asyncHandler(async (req, res) => {
  const logs = await listarLogsIntegracionService(req.tenant.id_empresa, req.query);
  return successResponse(res, "Logs de integracion obtenidos correctamente", logs);
});
