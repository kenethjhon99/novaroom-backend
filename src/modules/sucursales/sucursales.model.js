import { query } from "../../config/db.js";

export const listarSucursales = async (id_empresa) => {
  const result = await query(
    `
    SELECT *
    FROM "Sucursal"
    WHERE id_empresa = $1
    AND deleted_at IS NULL
    ORDER BY created_at DESC;
    `,
    [id_empresa]
  );

  return result.rows;
};

export const obtenerSucursalPorUuid = async (uuid_sucursal, id_empresa) => {
  const result = await query(
    `
    SELECT *
    FROM "Sucursal"
    WHERE uuid_sucursal = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_sucursal, id_empresa]
  );

  return result.rows[0] || null;
};

export const contarSucursalesActivas = async (client, id_empresa) => {
  const result = await client.query(
    `
    SELECT COUNT(*)::int AS total
    FROM "Sucursal"
    WHERE id_empresa = $1
    AND deleted_at IS NULL
    AND estado = 'ACTIVA';
    `,
    [id_empresa]
  );

  return result.rows[0].total;
};

export const obtenerLimiteSucursales = async (client, id_empresa) => {
  const result = await client.query(
    `
    SELECT max_sucursales
    FROM "Empresa_limite"
    WHERE id_empresa = $1
    LIMIT 1;
    `,
    [id_empresa]
  );

  return result.rows[0]?.max_sucursales || 1;
};

export const crearSucursal = async (client, id_empresa, data) => {
  const result = await client.query(
    `
    INSERT INTO "Sucursal" (
      id_empresa,
      nombre,
      direccion,
      telefono,
      whatsapp,
      email,
      coordenadas,
      estado
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVA')
    RETURNING *;
    `,
    [
      id_empresa,
      data.nombre,
      data.direccion || null,
      data.telefono || null,
      data.whatsapp || null,
      data.email || null,
      data.coordenadas || null,
    ]
  );

  return result.rows[0];
};

export const actualizarSucursal = async (uuid_sucursal, id_empresa, data) => {
  const result = await query(
    `
    UPDATE "Sucursal"
    SET
      nombre = COALESCE($1, nombre),
      direccion = COALESCE($2, direccion),
      telefono = COALESCE($3, telefono),
      whatsapp = COALESCE($4, whatsapp),
      email = COALESCE($5, email),
      coordenadas = COALESCE($6, coordenadas),
      updated_at = NOW()
    WHERE uuid_sucursal = $7
    AND id_empresa = $8
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [
      data.nombre ?? null,
      data.direccion ?? null,
      data.telefono ?? null,
      data.whatsapp ?? null,
      data.email ?? null,
      data.coordenadas ?? null,
      uuid_sucursal,
      id_empresa,
    ]
  );

  return result.rows[0] || null;
};

export const cambiarEstadoSucursal = async (uuid_sucursal, id_empresa, estado) => {
  const result = await query(
    `
    UPDATE "Sucursal"
    SET estado = $1,
        updated_at = NOW()
    WHERE uuid_sucursal = $2
    AND id_empresa = $3
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [estado, uuid_sucursal, id_empresa]
  );

  return result.rows[0] || null;
};

export const eliminarSucursal = async (uuid_sucursal, id_empresa) => {
  const result = await query(
    `
    UPDATE "Sucursal"
    SET deleted_at = NOW(),
        estado = 'INACTIVA',
        updated_at = NOW()
    WHERE uuid_sucursal = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [uuid_sucursal, id_empresa]
  );

  return result.rows[0] || null;
};