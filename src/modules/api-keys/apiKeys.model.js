import { query } from "../../config/db.js";

export const listarApiKeys = async (id_empresa) => {
  const result = await query(
    `
    SELECT
      id_api_key,
      uuid_api_key,
      id_empresa,
      nombre,
      key_prefix,
      scopes,
      activo,
      ultimo_uso_at,
      expira_at,
      creado_por,
      revoked_at,
      created_at,
      updated_at
    FROM "Api_key"
    WHERE id_empresa = $1
    ORDER BY created_at DESC;
    `,
    [id_empresa]
  );

  return result.rows;
};

export const crearApiKey = async (client, id_empresa, data, generated, creado_por) => {
  const result = await client.query(
    `
    INSERT INTO "Api_key" (
      id_empresa,
      nombre,
      key_hash,
      key_prefix,
      scopes,
      expira_at,
      creado_por
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING
      id_api_key,
      uuid_api_key,
      id_empresa,
      nombre,
      key_prefix,
      scopes,
      activo,
      expira_at,
      creado_por,
      created_at;
    `,
    [
      id_empresa,
      data.nombre,
      generated.hash,
      generated.prefix,
      JSON.stringify(data.scopes || []),
      data.expira_at || null,
      creado_por || null,
    ]
  );

  return result.rows[0];
};

export const revocarApiKey = async (uuid_api_key, id_empresa) => {
  const result = await query(
    `
    UPDATE "Api_key"
    SET activo = false,
        revoked_at = NOW(),
        updated_at = NOW()
    WHERE uuid_api_key = $1
    AND id_empresa = $2
    RETURNING
      id_api_key,
      uuid_api_key,
      id_empresa,
      nombre,
      key_prefix,
      scopes,
      activo,
      revoked_at;
    `,
    [uuid_api_key, id_empresa]
  );

  return result.rows[0] || null;
};
