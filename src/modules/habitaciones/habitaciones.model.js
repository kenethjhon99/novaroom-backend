import { query } from "../../config/db.js";

export const listarHabitaciones = async (id_empresa, filters = {}) => {
  const params = [id_empresa];

  let conditions = `
    WHERE h.id_empresa = $1
    AND h.deleted_at IS NULL
  `;

  if (filters.id_sucursal) {
    params.push(filters.id_sucursal);
    conditions += ` AND h.id_sucursal = $${params.length}`;
  }

  if (filters.id_area) {
    params.push(filters.id_area);
    conditions += ` AND h.id_area = $${params.length}`;
  }

  if (filters.id_nivel) {
    params.push(filters.id_nivel);
    conditions += ` AND h.id_nivel = $${params.length}`;
  }

  if (filters.estado) {
    params.push(filters.estado);
    conditions += ` AND h.estado = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      h.*,
      s.nombre AS sucursal,
      a.nombre AS area,
      a.tipo_area,
      n.nombre AS nivel,
      th.nombre AS tipo_habitacion
    FROM "Habitacion" h
    INNER JOIN "Sucursal" s ON s.id_sucursal = h.id_sucursal
    LEFT JOIN "Area" a ON a.id_area = h.id_area
    LEFT JOIN "Nivel" n ON n.id_nivel = h.id_nivel
    LEFT JOIN "Tipo_habitacion" th ON th.id_tipo_habitacion = h.id_tipo_habitacion
    ${conditions}
    ORDER BY h.orden_visual ASC, h.numero ASC;
    `,
    params
  );

  return result.rows;
};

export const obtenerHabitacionPorUuid = async (uuid_habitacion, id_empresa) => {
  const result = await query(
    `
    SELECT
      h.*,
      s.nombre AS sucursal,
      a.nombre AS area,
      a.tipo_area,
      n.nombre AS nivel,
      th.nombre AS tipo_habitacion
    FROM "Habitacion" h
    INNER JOIN "Sucursal" s ON s.id_sucursal = h.id_sucursal
    LEFT JOIN "Area" a ON a.id_area = h.id_area
    LEFT JOIN "Nivel" n ON n.id_nivel = h.id_nivel
    LEFT JOIN "Tipo_habitacion" th ON th.id_tipo_habitacion = h.id_tipo_habitacion
    WHERE h.uuid_habitacion = $1
    AND h.id_empresa = $2
    AND h.deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_habitacion, id_empresa]
  );

  return result.rows[0] || null;
};

export const validarSucursalEmpresa = async (id_sucursal, id_empresa) => {
  const result = await query(
    `
    SELECT id_sucursal
    FROM "Sucursal"
    WHERE id_sucursal = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_sucursal, id_empresa]
  );

  return !!result.rows[0];
};

export const validarAreaEmpresa = async (id_area, id_empresa, id_sucursal) => {
  const result = await query(
    `
    SELECT id_area
    FROM "Area"
    WHERE id_area = $1
    AND id_empresa = $2
    AND id_sucursal = $3
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_area, id_empresa, id_sucursal]
  );

  return !!result.rows[0];
};

export const validarNivelEmpresa = async (id_nivel, id_empresa, id_sucursal) => {
  const result = await query(
    `
    SELECT id_nivel
    FROM "Nivel"
    WHERE id_nivel = $1
    AND id_empresa = $2
    AND id_sucursal = $3
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_nivel, id_empresa, id_sucursal]
  );

  return !!result.rows[0];
};

export const contarHabitacionesActivas = async (client, id_empresa) => {
  const result = await client.query(
    `
    SELECT COUNT(*)::int AS total
    FROM "Habitacion"
    WHERE id_empresa = $1
    AND deleted_at IS NULL
    AND activo = true;
    `,
    [id_empresa]
  );

  return result.rows[0].total;
};

export const obtenerLimiteHabitaciones = async (client, id_empresa) => {
  const result = await client.query(
    `
    SELECT max_habitaciones
    FROM "Empresa_limite"
    WHERE id_empresa = $1
    LIMIT 1;
    `,
    [id_empresa]
  );

  return result.rows[0]?.max_habitaciones || 20;
};

export const crearHabitacion = async (client, id_empresa, data) => {
  const result = await client.query(
    `
    INSERT INTO "Habitacion" (
      id_empresa,
      id_sucursal,
      id_area,
      id_nivel,
      id_tipo_habitacion,
      numero,
      nombre,
      descripcion,
      precio_hora,
      precio_noche,
      precio_tiempo_extra,
      combo_horas,
      precio_combo_horas,
      tarifa_combo_nombre,
      capacidad_personas,
      tiene_parqueo_privado,
      permite_reserva,
      permite_noche,
      posicion_x,
      posicion_y,
      orden_visual,
      observaciones,
      estado,
      activo
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
      'DISPONIBLE', true
    )
    RETURNING *;
    `,
    [
      id_empresa,
      data.id_sucursal,
      data.id_area || null,
      data.id_nivel || null,
      data.id_tipo_habitacion || null,
      data.numero,
      data.nombre || null,
      data.descripcion || null,
      data.precio_hora || 0,
      data.precio_noche || 0,
      data.precio_tiempo_extra || 0,
      data.combo_horas || null,
      data.precio_combo_horas || 0,
      data.tarifa_combo_nombre || null,
      data.capacidad_personas || 2,
      data.tiene_parqueo_privado || false,
      data.permite_reserva || false,
      data.permite_noche ?? true,
      data.posicion_x || 0,
      data.posicion_y || 0,
      data.orden_visual || 0,
      data.observaciones || null,
    ]
  );

  return result.rows[0];
};

export const actualizarHabitacion = async (uuid_habitacion, id_empresa, data) => {
  const result = await query(
    `
    UPDATE "Habitacion"
    SET
      id_sucursal = COALESCE($1, id_sucursal),
      id_area = COALESCE($2, id_area),
      id_nivel = COALESCE($3, id_nivel),
      id_tipo_habitacion = COALESCE($4, id_tipo_habitacion),
      numero = COALESCE($5, numero),
      nombre = COALESCE($6, nombre),
      descripcion = COALESCE($7, descripcion),
      precio_hora = COALESCE($8, precio_hora),
      precio_noche = COALESCE($9, precio_noche),
      precio_tiempo_extra = COALESCE($10, precio_tiempo_extra),
      combo_horas = COALESCE($11, combo_horas),
      precio_combo_horas = COALESCE($12, precio_combo_horas),
      tarifa_combo_nombre = COALESCE($13, tarifa_combo_nombre),
      capacidad_personas = COALESCE($14, capacidad_personas),
      tiene_parqueo_privado = COALESCE($15, tiene_parqueo_privado),
      permite_reserva = COALESCE($16, permite_reserva),
      permite_noche = COALESCE($17, permite_noche),
      posicion_x = COALESCE($18, posicion_x),
      posicion_y = COALESCE($19, posicion_y),
      orden_visual = COALESCE($20, orden_visual),
      observaciones = COALESCE($21, observaciones),
      updated_at = NOW()
    WHERE uuid_habitacion = $22
    AND id_empresa = $23
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [
      data.id_sucursal ?? null,
      data.id_area ?? null,
      data.id_nivel ?? null,
      data.id_tipo_habitacion ?? null,
      data.numero ?? null,
      data.nombre ?? null,
      data.descripcion ?? null,
      data.precio_hora ?? null,
      data.precio_noche ?? null,
      data.precio_tiempo_extra ?? null,
      data.combo_horas ?? null,
      data.precio_combo_horas ?? null,
      data.tarifa_combo_nombre ?? null,
      data.capacidad_personas ?? null,
      data.tiene_parqueo_privado ?? null,
      data.permite_reserva ?? null,
      data.permite_noche ?? null,
      data.posicion_x ?? null,
      data.posicion_y ?? null,
      data.orden_visual ?? null,
      data.observaciones ?? null,
      uuid_habitacion,
      id_empresa,
    ]
  );

  return result.rows[0] || null;
};

export const cambiarEstadoHabitacion = async (
  client,
  uuid_habitacion,
  id_empresa,
  estado
) => {
  const result = await client.query(
    `
    UPDATE "Habitacion"
    SET estado = $1,
        updated_at = NOW()
    WHERE uuid_habitacion = $2
    AND id_empresa = $3
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [estado, uuid_habitacion, id_empresa]
  );

  return result.rows[0] || null;
};

export const crearHistorialEstado = async (
  client,
  data
) => {
  const result = await client.query(
    `
    INSERT INTO "Habitacion_estado_historial" (
      id_empresa,
      id_sucursal,
      id_habitacion,
      estado_anterior,
      estado_nuevo,
      motivo,
      cambiado_por
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.id_sucursal,
      data.id_habitacion,
      data.estado_anterior,
      data.estado_nuevo,
      data.motivo || null,
      data.cambiado_por || null,
    ]
  );

  return result.rows[0];
};

export const eliminarHabitacion = async (uuid_habitacion, id_empresa) => {
  const result = await query(
    `
    UPDATE "Habitacion"
    SET deleted_at = NOW(),
        activo = false,
        estado = 'DESHABILITADA',
        updated_at = NOW()
    WHERE uuid_habitacion = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [uuid_habitacion, id_empresa]
  );

  return result.rows[0] || null;
};
export const obtenerMapaHabitaciones = async (id_empresa, filters = {}) => {
  const params = [id_empresa];

  let conditions = `
    WHERE h.id_empresa = $1
    AND h.deleted_at IS NULL
    AND h.activo = true
  `;

  if (filters.id_sucursal) {
    params.push(filters.id_sucursal);
    conditions += ` AND h.id_sucursal = $${params.length}`;
  }

  if (filters.id_area) {
    params.push(filters.id_area);
    conditions += ` AND h.id_area = $${params.length}`;
  }

  if (filters.id_nivel) {
    params.push(filters.id_nivel);
    conditions += ` AND h.id_nivel = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      h.id_habitacion,
      h.uuid_habitacion,
      h.numero,
      h.nombre,
      h.estado,
      h.precio_hora,
      h.precio_noche,
      h.precio_tiempo_extra,
      h.combo_horas,
      h.precio_combo_horas,
      h.tarifa_combo_nombre,
      h.tiene_parqueo_privado,
      h.permite_reserva,
      h.permite_noche,
      h.posicion_x,
      h.posicion_y,
      h.orden_visual,

      s.id_sucursal,
      s.uuid_sucursal,
      s.nombre AS sucursal,

      a.id_area,
      a.uuid_area,
      a.nombre AS area,
      a.tipo_area,

      n.id_nivel,
      n.uuid_nivel,
      n.nombre AS nivel,
      n.numero AS numero_nivel,

      th.nombre AS tipo_habitacion,

      o.uuid_ocupacion,
      o.fecha_entrada,
      o.tipo_ocupacion,
      o.precio_base,
      o.combo_horas,
      o.tarifa_nombre,
      o.monto_extras,
      o.monto_tiempo_extra,
      o.monto_total

    FROM "Habitacion" h
    INNER JOIN "Sucursal" s ON s.id_sucursal = h.id_sucursal
    LEFT JOIN "Area" a ON a.id_area = h.id_area
    LEFT JOIN "Nivel" n ON n.id_nivel = h.id_nivel
    LEFT JOIN "Tipo_habitacion" th 
      ON th.id_tipo_habitacion = h.id_tipo_habitacion

    LEFT JOIN "Ocupacion" o 
      ON o.id_habitacion = h.id_habitacion
      AND o.estado = 'ACTIVA'
      AND o.deleted_at IS NULL

    ${conditions}
    ORDER BY 
      s.nombre ASC,
      a.nombre ASC NULLS LAST,
      n.numero ASC NULLS LAST,
      h.orden_visual ASC,
      h.numero ASC;
    `,
    params
  );

  return result.rows;
};
