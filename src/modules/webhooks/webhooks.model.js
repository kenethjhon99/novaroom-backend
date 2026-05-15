import { query } from "../../config/db.js";

export const listarWebhooks = async (id_empresa) => {
  const result = await query(
    `
    SELECT
      id_webhook_empresa,
      uuid_webhook_empresa,
      id_empresa,
      nombre,
      url,
      eventos,
      activo,
      created_at,
      updated_at
    FROM "Webhook_empresa"
    WHERE id_empresa = $1
    ORDER BY created_at DESC;
    `,
    [id_empresa]
  );

  return result.rows;
};

export const obtenerWebhookPorUuid = async (uuid_webhook, id_empresa) => {
  const result = await query(
    `
    SELECT *
    FROM "Webhook_empresa"
    WHERE uuid_webhook_empresa = $1
    AND id_empresa = $2
    LIMIT 1;
    `,
    [uuid_webhook, id_empresa]
  );

  return result.rows[0] || null;
};

export const crearWebhook = async (client, id_empresa, data, secreto) => {
  const result = await client.query(
    `
    INSERT INTO "Webhook_empresa" (
      id_empresa,
      nombre,
      url,
      eventos,
      activo,
      secreto
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING
      id_webhook_empresa,
      uuid_webhook_empresa,
      id_empresa,
      nombre,
      url,
      eventos,
      activo,
      created_at,
      updated_at;
    `,
    [
      id_empresa,
      data.nombre,
      data.url,
      JSON.stringify(data.eventos || []),
      data.activo ?? true,
      secreto,
    ]
  );

  return result.rows[0];
};

export const actualizarWebhook = async (uuid_webhook, id_empresa, data) => {
  const result = await query(
    `
    UPDATE "Webhook_empresa"
    SET nombre = COALESCE($1, nombre),
        url = COALESCE($2, url),
        eventos = COALESCE($3, eventos),
        activo = COALESCE($4, activo),
        updated_at = NOW()
    WHERE uuid_webhook_empresa = $5
    AND id_empresa = $6
    RETURNING
      id_webhook_empresa,
      uuid_webhook_empresa,
      id_empresa,
      nombre,
      url,
      eventos,
      activo,
      created_at,
      updated_at;
    `,
    [
      data.nombre ?? null,
      data.url ?? null,
      data.eventos ? JSON.stringify(data.eventos) : null,
      data.activo ?? null,
      uuid_webhook,
      id_empresa,
    ]
  );

  return result.rows[0] || null;
};

export const listarLogsIntegracion = async (id_empresa, filters = {}) => {
  const params = [id_empresa];
  const where = [`l.id_empresa = $1`];

  if (filters.evento) {
    params.push(filters.evento);
    where.push(`l.evento = $${params.length}`);
  }

  if (filters.ok !== undefined) {
    params.push(filters.ok === "true");
    where.push(`l.ok = $${params.length}`);
  }

  const limit = Math.min(Math.max(Number(filters.limit || 100), 1), 200);
  params.push(limit);

  const result = await query(
    `
    SELECT
      l.*,
      w.nombre AS webhook,
      w.url
    FROM "Webhook_entrega_log" l
    INNER JOIN "Webhook_empresa" w
      ON w.id_webhook_empresa = l.id_webhook_empresa
    WHERE ${where.join(" AND ")}
    ORDER BY l.created_at DESC
    LIMIT $${params.length};
    `,
    params
  );

  return result.rows;
};
