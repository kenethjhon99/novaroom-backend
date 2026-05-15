import { query } from "../../config/db.js";

export const listarTiposHabitacion = async (id_empresa) => {
  const result = await query(
    `
    SELECT *
    FROM "Tipo_habitacion"
    WHERE id_empresa = $1
    AND deleted_at IS NULL
    ORDER BY nombre ASC;
    `,
    [id_empresa]
  );

  return result.rows;
};

export const crearTipoHabitacion = async (id_empresa, data) => {
  const result = await query(
    `
    INSERT INTO "Tipo_habitacion" (
      id_empresa,
      nombre,
      descripcion,
      precio_base_hora,
      precio_base_noche,
      precio_tiempo_extra
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
    `,
    [
      id_empresa,
      data.nombre,
      data.descripcion || null,
      data.precio_base_hora || 0,
      data.precio_base_noche || 0,
      data.precio_tiempo_extra || 0,
    ]
  );

  return result.rows[0];
};

export const actualizarTipoHabitacion = async (uuid, id_empresa, data) => {
  const result = await query(
    `
    UPDATE "Tipo_habitacion"
    SET
      nombre = COALESCE($1, nombre),
      descripcion = COALESCE($2, descripcion),
      precio_base_hora = COALESCE($3, precio_base_hora),
      precio_base_noche = COALESCE($4, precio_base_noche),
      precio_tiempo_extra = COALESCE($5, precio_tiempo_extra),
      updated_at = NOW()
    WHERE uuid_tipo_habitacion = $6
    AND id_empresa = $7
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [
      data.nombre ?? null,
      data.descripcion ?? null,
      data.precio_base_hora ?? null,
      data.precio_base_noche ?? null,
      data.precio_tiempo_extra ?? null,
      uuid,
      id_empresa,
    ]
  );

  return result.rows[0] || null;
};

export const eliminarTipoHabitacion = async (uuid, id_empresa) => {
  const result = await query(
    `
    UPDATE "Tipo_habitacion"
    SET deleted_at = NOW(),
        estado = 'INACTIVO',
        updated_at = NOW()
    WHERE uuid_tipo_habitacion = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [uuid, id_empresa]
  );

  return result.rows[0] || null;
};