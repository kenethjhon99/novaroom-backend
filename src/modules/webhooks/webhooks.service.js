import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { registrarAuditoria } from "../../utils/audit.js";
import {
  createWebhookSecret,
  entregarWebhooks,
} from "../../utils/integrationEvents.js";
import {
  actualizarWebhook,
  crearWebhook,
  listarLogsIntegracion,
  listarWebhooks,
  obtenerWebhookPorUuid,
} from "./webhooks.model.js";

export const listarWebhooksService = async (id_empresa) => listarWebhooks(id_empresa);

export const crearWebhookService = async (id_empresa, data, user) => {
  return withTransaction(async (client) => {
    const secreto = createWebhookSecret();
    const webhook = await crearWebhook(client, id_empresa, data, secreto);

    await registrarAuditoria({
      client,
      id_empresa,
      id_usuario: user?.id_usuario || null,
      modulo: "webhooks",
      tabla_afectada: "Webhook_empresa",
      id_registro: webhook.id_webhook_empresa,
      accion: "WEBHOOK_CREADO",
      descripcion: "Webhook creado",
      valores_nuevos: webhook,
    });

    return {
      ...webhook,
      secreto,
    };
  });
};

export const actualizarWebhookService = async (uuid_webhook, id_empresa, data, user) => {
  const anterior = await obtenerWebhookPorUuid(uuid_webhook, id_empresa);

  if (!anterior) {
    throw new AppError("Webhook no encontrado", 404, null, "WEBHOOK_NOT_FOUND");
  }

  const webhook = await actualizarWebhook(uuid_webhook, id_empresa, data);

  await registrarAuditoria({
    id_empresa,
    id_usuario: user?.id_usuario || null,
    modulo: "webhooks",
    tabla_afectada: "Webhook_empresa",
    id_registro: webhook.id_webhook_empresa,
    accion: "WEBHOOK_ACTUALIZADO",
    descripcion: "Webhook actualizado",
    valores_anteriores: anterior,
    valores_nuevos: webhook,
  });

  return webhook;
};

export const probarWebhookService = async (uuid_webhook, id_empresa, data) => {
  const webhook = await obtenerWebhookPorUuid(uuid_webhook, id_empresa);

  if (!webhook) {
    throw new AppError("Webhook no encontrado", 404, null, "WEBHOOK_NOT_FOUND");
  }

  return entregarWebhooks({
    id_empresa,
    evento: data.evento || "webhook.test",
    payload: {
      test: true,
      webhook_uuid: uuid_webhook,
      ...data.payload,
    },
  });
};

export const listarLogsIntegracionService = async (id_empresa, filters) => {
  return listarLogsIntegracion(id_empresa, filters);
};
