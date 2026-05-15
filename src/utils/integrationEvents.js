import { createHmac, randomBytes } from "crypto";

import { query } from "../config/db.js";

export const createWebhookSecret = () => randomBytes(32).toString("base64url");

const signPayload = (secret, body) => {
  return createHmac("sha256", secret).update(body).digest("hex");
};

export const registrarEventoSistema = async ({
  client = null,
  id_empresa = null,
  id_sucursal = null,
  evento,
  payload = {},
}) => {
  const executor = client || { query };
  const result = await executor.query(
    `
    INSERT INTO "Evento_sistema" (
      id_empresa,
      id_sucursal,
      evento,
      payload,
      procesado
    )
    VALUES ($1,$2,$3,$4,false)
    RETURNING *;
    `,
    [id_empresa, id_sucursal, evento, JSON.stringify(payload)]
  );

  return result.rows[0];
};

export const entregarWebhooks = async ({
  id_empresa,
  id_sucursal = null,
  evento,
  payload = {},
}) => {
  await registrarEventoSistema({ id_empresa, id_sucursal, evento, payload });

  const result = await query(
    `
    SELECT *
    FROM "Webhook_empresa"
    WHERE id_empresa = $1
    AND activo = true
    AND (eventos ? $2 OR eventos ? '*');
    `,
    [id_empresa, evento]
  );

  const body = JSON.stringify({
    event: evento,
    company_id: id_empresa,
    branch_id: id_sucursal,
    payload,
    created_at: new Date().toISOString(),
  });

  const deliveries = [];

  for (const webhook of result.rows) {
    let statusCode = null;
    let ok = false;
    let error = null;

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-novaroom-event": evento,
          "x-novaroom-signature": signPayload(webhook.secreto || "", body),
        },
        body,
      });

      statusCode = response.status;
      ok = response.ok;
      if (!response.ok) {
        error = `HTTP ${response.status}`;
      }
    } catch (err) {
      error = err.message;
    }

    const log = await query(
      `
      INSERT INTO "Webhook_entrega_log" (
        id_empresa,
        id_webhook_empresa,
        evento,
        payload,
        status_code,
        ok,
        intento,
        error
      )
      VALUES ($1,$2,$3,$4,$5,$6,1,$7)
      RETURNING *;
      `,
      [
        id_empresa,
        webhook.id_webhook_empresa,
        evento,
        body,
        statusCode,
        ok,
        error,
      ]
    );

    deliveries.push(log.rows[0]);
  }

  return deliveries;
};
