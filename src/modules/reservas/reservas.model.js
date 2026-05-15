import { query } from "../../config/db.js";

export const obtenerHabitacionPorUuid = async (client, uuid_habitacion, id_empresa) => {
  const result = await client.query(
    `
    SELECT *
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

export const existeReservaSolapada = async (
  client,
  id_empresa,
  id_habitacion,
  fecha_inicio,
  fecha_fin
) => {
  const result = await client.query(
    `
    SELECT id_reserva
    FROM "Reserva"
    WHERE id_empresa = $1
    AND id_habitacion = $2
    AND estado IN ('PENDIENTE', 'CONFIRMADA')
    AND deleted_at IS NULL
    AND fecha_inicio < $4
    AND fecha_fin > $3
    LIMIT 1;
    `,
    [id_empresa, id_habitacion, fecha_inicio, fecha_fin]
  );

  return !!result.rows[0];
};

export const crearReserva = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO "Reserva" (
      id_empresa,
      id_sucursal,
      id_area,
      id_habitacion,
      nombre_cliente,
      telefono_cliente,
      tipo_reserva,
      estado,
      fecha_inicio,
      fecha_fin,
      monto_estimado,
      anticipo,
      observaciones,
      creada_por
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDIENTE',$8,$9,$10,$11,$12,$13)
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.id_sucursal,
      data.id_area,
      data.id_habitacion,
      data.nombre_cliente || null,
      data.telefono_cliente || null,
      data.tipo_reserva,
      data.fecha_inicio,
      data.fecha_fin,
      data.monto_estimado || 0,
      data.anticipo || 0,
      data.observaciones || null,
      data.creada_por,
    ]
  );

  return result.rows[0];
};

export const listarReservas = async (id_empresa, filters = {}) => {
  const params = [id_empresa];

  let conditions = `
    WHERE r.id_empresa = $1
    AND r.deleted_at IS NULL
  `;

  if (filters.estado) {
    params.push(filters.estado);
    conditions += ` AND r.estado = $${params.length}`;
  }

  if (filters.id_sucursal) {
    params.push(filters.id_sucursal);
    conditions += ` AND r.id_sucursal = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      r.*,
      h.numero AS habitacion,
      h.nombre AS nombre_habitacion,
      s.nombre AS sucursal,
      a.nombre AS area
    FROM "Reserva" r
    INNER JOIN "Habitacion" h ON h.id_habitacion = r.id_habitacion
    INNER JOIN "Sucursal" s ON s.id_sucursal = r.id_sucursal
    LEFT JOIN "Area" a ON a.id_area = r.id_area
    ${conditions}
    ORDER BY r.fecha_inicio ASC;
    `,
    params
  );

  return result.rows;
};

export const obtenerReservaPorUuid = async (client, uuid_reserva, id_empresa) => {
  const result = await client.query(
    `
    SELECT
      r.*,
      h.estado AS estado_habitacion
    FROM "Reserva" r
    INNER JOIN "Habitacion" h ON h.id_habitacion = r.id_habitacion
    WHERE r.uuid_reserva = $1
    AND r.id_empresa = $2
    AND r.deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_reserva, id_empresa]
  );

  return result.rows[0] || null;
};

export const confirmarReserva = async (client, uuid_reserva, id_empresa, id_usuario) => {
  const result = await client.query(
    `
    UPDATE "Reserva"
    SET estado = 'CONFIRMADA',
        confirmada_por = $1,
        fecha_confirmacion = NOW(),
        updated_at = NOW()
    WHERE uuid_reserva = $2
    AND id_empresa = $3
    AND estado = 'PENDIENTE'
    RETURNING *;
    `,
    [id_usuario, uuid_reserva, id_empresa]
  );

  return result.rows[0] || null;
};

export const cancelarReserva = async (client, uuid_reserva, id_empresa, id_usuario, motivo) => {
  const result = await client.query(
    `
    UPDATE "Reserva"
    SET estado = 'CANCELADA',
        cancelada_por = $1,
        fecha_cancelacion = NOW(),
        observaciones = COALESCE(observaciones, '') || E'\\nCancelación: ' || $2,
        updated_at = NOW()
    WHERE uuid_reserva = $3
    AND id_empresa = $4
    AND estado IN ('PENDIENTE', 'CONFIRMADA')
    RETURNING *;
    `,
    [id_usuario, motivo, uuid_reserva, id_empresa]
  );

  return result.rows[0] || null;
};

export const crearOcupacionDesdeReserva = async (client, reserva, id_usuario, observaciones) => {
  const result = await client.query(
    `
    INSERT INTO "Ocupacion" (
      id_empresa,
      id_sucursal,
      id_area,
      id_habitacion,
      tipo_ocupacion,
      estado,
      precio_base,
      monto_total,
      observaciones,
      abierta_por
    )
    VALUES ($1,$2,$3,$4,$5,'ACTIVA',$6,$6,$7,$8)
    RETURNING *;
    `,
    [
      reserva.id_empresa,
      reserva.id_sucursal,
      reserva.id_area,
      reserva.id_habitacion,
      reserva.tipo_reserva === "POR_NOCHE" ? "POR_NOCHE" : "POR_HORA",
      reserva.monto_estimado || 0,
      observaciones || "Check-in desde reserva",
      id_usuario,
    ]
  );

  return result.rows[0];
};

export const marcarReservaCheckin = async (client, uuid_reserva, id_empresa) => {
  const result = await client.query(
    `
    UPDATE "Reserva"
    SET estado = 'CHECKIN_REALIZADO',
        updated_at = NOW()
    WHERE uuid_reserva = $1
    AND id_empresa = $2
    RETURNING *;
    `,
    [uuid_reserva, id_empresa]
  );

  return result.rows[0];
};

export const cambiarHabitacionEstado = async (client, id_habitacion, id_empresa, estado) => {
  const result = await client.query(
    `
    UPDATE "Habitacion"
    SET estado = $1,
        updated_at = NOW()
    WHERE id_habitacion = $2
    AND id_empresa = $3
    RETURNING *;
    `,
    [estado, id_habitacion, id_empresa]
  );

  return result.rows[0];
};

export const crearHistorialHabitacion = async (client, data) => {
  await client.query(
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
    VALUES ($1,$2,$3,$4,$5,$6,$7);
    `,
    [
      data.id_empresa,
      data.id_sucursal,
      data.id_habitacion,
      data.estado_anterior,
      data.estado_nuevo,
      data.motivo,
      data.cambiado_por,
    ]
  );
};