import { randomBytes } from "crypto";

import { query } from "../../config/db.js";

export const generarTokenDominio = () => {
  return `novaroom-${randomBytes(18).toString("hex")}`;
};

export const listarDominios = async (id_empresa) => {
  const result = await query(
    `
    SELECT
      *,
      '_novaroom.' || dominio AS dns_host,
      'TXT' AS dns_tipo,
      verificacion_token AS dns_valor
    FROM "Empresa_dominio"
    WHERE id_empresa = $1
    AND deleted_at IS NULL
    ORDER BY created_at DESC;
    `,
    [id_empresa]
  );

  return result.rows;
};

export const crearDominio = async (client, id_empresa, data) => {
  const token = generarTokenDominio();
  const result = await client.query(
    `
    INSERT INTO "Empresa_dominio" (
      id_empresa,
      dominio,
      tipo,
      proveedor,
      verificacion_token,
      notas
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
    `,
    [
      id_empresa,
      data.dominio,
      data.tipo || "PANEL",
      data.proveedor || "MANUAL",
      token,
      data.notas || null,
    ]
  );

  return result.rows[0];
};

export const obtenerDominioPorUuid = async (uuid_empresa_dominio, id_empresa) => {
  const result = await query(
    `
    SELECT
      *,
      '_novaroom.' || dominio AS dns_host,
      'TXT' AS dns_tipo,
      verificacion_token AS dns_valor
    FROM "Empresa_dominio"
    WHERE uuid_empresa_dominio = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_empresa_dominio, id_empresa]
  );

  return result.rows[0] || null;
};

export const actualizarDominio = async (
  uuid_empresa_dominio,
  id_empresa,
  data
) => {
  const result = await query(
    `
    UPDATE "Empresa_dominio"
    SET tipo = COALESCE($1, tipo),
        proveedor = COALESCE($2, proveedor),
        estado = COALESCE($3, estado),
        ssl_activo = COALESCE($4, ssl_activo),
        notas = COALESCE($5, notas),
        fecha_verificacion = CASE
          WHEN $3 IN ('VERIFICADO', 'ACTIVO') AND fecha_verificacion IS NULL THEN NOW()
          ELSE fecha_verificacion
        END,
        updated_at = NOW()
    WHERE uuid_empresa_dominio = $6
    AND id_empresa = $7
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [
      data.tipo ?? null,
      data.proveedor ?? null,
      data.estado ?? null,
      data.ssl_activo ?? null,
      data.notas ?? null,
      uuid_empresa_dominio,
      id_empresa,
    ]
  );

  return result.rows[0] || null;
};

export const eliminarDominio = async (uuid_empresa_dominio, id_empresa) => {
  const result = await query(
    `
    UPDATE "Empresa_dominio"
    SET deleted_at = NOW(),
        estado = 'SUSPENDIDO',
        updated_at = NOW()
    WHERE uuid_empresa_dominio = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [uuid_empresa_dominio, id_empresa]
  );

  return result.rows[0] || null;
};
