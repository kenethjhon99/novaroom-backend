import { query } from "../../config/db.js";

export const listarAreas = async (id_empresa, id_sucursal = null) => {
  const params = [id_empresa];
  let filter = "";

  if (id_sucursal) {
    params.push(id_sucursal);
    filter = "AND id_sucursal = $2";
  }

  const result = await query(
    `
    SELECT *
    FROM "Area"
    WHERE id_empresa = $1
    ${filter}
    AND deleted_at IS NULL
    ORDER BY created_at DESC;
    `,
    params
  );

  return result.rows;
};

export const obtenerAreaPorUuid = async (uuid_area, id_empresa) => {
  const result = await query(
    `
    SELECT *
    FROM "Area"
    WHERE uuid_area = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_area, id_empresa]
  );

  return result.rows[0] || null;
};

export const crearArea = async (id_empresa, data) => {
  const result = await query(
    `
    INSERT INTO "Area" (
      id_empresa,
      id_sucursal,
      nombre,
      tipo_area,
      descripcion,
      configuracion_json
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
    `,
    [
      id_empresa,
      data.id_sucursal,
      data.nombre,
      data.tipo_area || "PERSONALIZADA",
      data.descripcion || null,
      data.configuracion_json || {},
    ]
  );

  return result.rows[0];
};

export const actualizarArea = async (uuid_area, id_empresa, data) => {
  const result = await query(
    `
    UPDATE "Area"
    SET
      id_sucursal = COALESCE($1, id_sucursal),
      nombre = COALESCE($2, nombre),
      tipo_area = COALESCE($3, tipo_area),
      descripcion = COALESCE($4, descripcion),
      configuracion_json = COALESCE($5, configuracion_json),
      updated_at = NOW()
    WHERE uuid_area = $6
    AND id_empresa = $7
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [
      data.id_sucursal ?? null,
      data.nombre ?? null,
      data.tipo_area ?? null,
      data.descripcion ?? null,
      data.configuracion_json ?? null,
      uuid_area,
      id_empresa,
    ]
  );

  return result.rows[0] || null;
};

export const cambiarEstadoArea = async (uuid_area, id_empresa, activo) => {
  const result = await query(
    `
    UPDATE "Area"
    SET activo = $1,
        updated_at = NOW()
    WHERE uuid_area = $2
    AND id_empresa = $3
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [activo, uuid_area, id_empresa]
  );

  return result.rows[0] || null;
};

export const eliminarArea = async (uuid_area, id_empresa) => {
  const result = await query(
    `
    UPDATE "Area"
    SET deleted_at = NOW(),
        activo = false,
        updated_at = NOW()
    WHERE uuid_area = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [uuid_area, id_empresa]
  );

  return result.rows[0] || null;
};