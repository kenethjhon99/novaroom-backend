import { query } from "../../config/db.js";

export const listarServiciosHabitacion = async (id_empresa) => {
  const result = await query(
    `
    SELECT *
    FROM "Servicio_habitacion"
    WHERE id_empresa = $1
    AND deleted_at IS NULL
    ORDER BY nombre ASC;
    `,
    [id_empresa]
  );

  return result.rows;
};

export const crearServicioHabitacion = async (id_empresa, data) => {
  const result = await query(
    `
    INSERT INTO "Servicio_habitacion" (
      id_empresa,
      nombre,
      descripcion,
      icono
    )
    VALUES ($1,$2,$3,$4)
    RETURNING *;
    `,
    [id_empresa, data.nombre, data.descripcion || null, data.icono || null]
  );

  return result.rows[0];
};

export const actualizarServicioHabitacion = async (uuid, id_empresa, data) => {
  const result = await query(
    `
    UPDATE "Servicio_habitacion"
    SET
      nombre = COALESCE($1, nombre),
      descripcion = COALESCE($2, descripcion),
      icono = COALESCE($3, icono),
      updated_at = NOW()
    WHERE uuid_servicio_habitacion = $4
    AND id_empresa = $5
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [
      data.nombre ?? null,
      data.descripcion ?? null,
      data.icono ?? null,
      uuid,
      id_empresa,
    ]
  );

  return result.rows[0] || null;
};

export const eliminarServicioHabitacion = async (uuid, id_empresa) => {
  const result = await query(
    `
    UPDATE "Servicio_habitacion"
    SET deleted_at = NOW(),
        activo = false,
        updated_at = NOW()
    WHERE uuid_servicio_habitacion = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [uuid, id_empresa]
  );

  return result.rows[0] || null;
};

export const validarHabitacionEmpresa = async (uuid_habitacion, id_empresa) => {
  const result = await query(
    `
    SELECT id_habitacion
    FROM "Habitacion"
    WHERE uuid_habitacion = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_habitacion, id_empresa]
  );

  return result.rows[0] || null;
};

export const asignarServiciosHabitacion = async (
  id_empresa,
  id_habitacion,
  servicios
) => {
  await query(
    `
    UPDATE "Habitacion_servicio"
    SET activo = false
    WHERE id_empresa = $1
    AND id_habitacion = $2;
    `,
    [id_empresa, id_habitacion]
  );

  const result = [];

  for (const id_servicio of servicios) {
    const inserted = await query(
      `
      INSERT INTO "Habitacion_servicio" (
        id_empresa,
        id_habitacion,
        id_servicio_habitacion,
        activo
      )
      VALUES ($1,$2,$3,true)
      ON CONFLICT (id_habitacion, id_servicio_habitacion)
      DO UPDATE SET activo = true
      RETURNING *;
      `,
      [id_empresa, id_habitacion, id_servicio]
    );

    result.push(inserted.rows[0]);
  }

  return result;
};

export const listarServiciosDeHabitacion = async (uuid_habitacion, id_empresa) => {
  const result = await query(
    `
    SELECT 
      sh.*
    FROM "Habitacion_servicio" hs
    INNER JOIN "Habitacion" h ON h.id_habitacion = hs.id_habitacion
    INNER JOIN "Servicio_habitacion" sh 
      ON sh.id_servicio_habitacion = hs.id_servicio_habitacion
    WHERE h.uuid_habitacion = $1
    AND h.id_empresa = $2
    AND hs.activo = true
    AND sh.deleted_at IS NULL
    ORDER BY sh.nombre ASC;
    `,
    [uuid_habitacion, id_empresa]
  );

  return result.rows;
};