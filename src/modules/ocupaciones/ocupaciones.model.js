import { query } from "../../config/db.js";
export const obtenerHabitacionParaOcupacion = async (client, uuid_habitacion, id_empresa) => {
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

export const crearOcupacion = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO "Ocupacion" (
      id_empresa,
      id_sucursal,
      id_area,
      id_habitacion,
      tipo_ocupacion,
      combo_horas,
      tarifa_nombre,
      estado,
      precio_base,
      monto_total,
      observaciones,
      abierta_por
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVA',$8,$8,$9,$10)
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.id_sucursal,
      data.id_area,
      data.id_habitacion,
      data.tipo_ocupacion,
      data.combo_horas || null,
      data.tarifa_nombre || null,
      data.precio_base,
      data.observaciones || null,
      data.abierta_por,
    ]
  );

  return result.rows[0];
};

export const cambiarHabitacionAOcupada = async (client, id_habitacion, id_empresa) => {
  const result = await client.query(
    `
    UPDATE "Habitacion"
    SET estado = 'OCUPADA',
        updated_at = NOW()
    WHERE id_habitacion = $1
    AND id_empresa = $2
    RETURNING *;
    `,
    [id_habitacion, id_empresa]
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

export const listarOcupacionesActivas = async (id_empresa, id_sucursal = null) => {
  const params = [id_empresa];

  let filter = "";

  if (id_sucursal) {
    params.push(id_sucursal);
    filter = `AND o.id_sucursal = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      o.*,
      h.numero AS habitacion,
      h.nombre AS nombre_habitacion,
      s.nombre AS sucursal,
      a.nombre AS area
    FROM "Ocupacion" o
    INNER JOIN "Habitacion" h ON h.id_habitacion = o.id_habitacion
    INNER JOIN "Sucursal" s ON s.id_sucursal = o.id_sucursal
    LEFT JOIN "Area" a ON a.id_area = o.id_area
    WHERE o.id_empresa = $1
    ${filter}
    AND o.estado = 'ACTIVA'
    AND o.deleted_at IS NULL
    ORDER BY o.fecha_entrada DESC;
    `,
    params
  );

  return result.rows;
};

export const obtenerOcupacionActivaPorUuid = async (
  client,
  uuid_ocupacion,
  id_empresa
) => {
  const result = await client.query(
    `
    SELECT
      o.*,
      h.numero AS habitacion,
      h.estado AS estado_habitacion,
      h.precio_hora,
      h.precio_noche,
      h.precio_tiempo_extra
    FROM "Ocupacion" o
    INNER JOIN "Habitacion" h ON h.id_habitacion = o.id_habitacion
    WHERE o.uuid_ocupacion = $1
    AND o.id_empresa = $2
    AND o.estado = 'ACTIVA'
    AND o.deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_ocupacion, id_empresa]
  );

  return result.rows[0] || null;
};

export const actualizarMontoOcupacion = async (
  client,
  id_ocupacion,
  tiempoMinutos,
  montoBase,
  montoExtras,
  montoTiempoExtra,
  montoDescuento,
  montoTotal
) => {
  const result = await client.query(
    `
    UPDATE "Ocupacion"
    SET
      tiempo_minutos = $1,
      precio_base = $2,
      monto_extras = $3,
      monto_tiempo_extra = $4,
      monto_descuento = $5,
      monto_total = $6,
      updated_at = NOW()
    WHERE id_ocupacion = $7
    RETURNING *;
    `,
    [
      tiempoMinutos,
      montoBase,
      montoExtras,
      montoTiempoExtra,
      montoDescuento,
      montoTotal,
      id_ocupacion,
    ]
  );

  return result.rows[0];
};

export const cerrarOcupacion = async (
  client,
  id_ocupacion,
  id_empresa,
  id_usuario
) => {
  const result = await client.query(
    `
    UPDATE "Ocupacion"
    SET
      estado = 'FINALIZADA',
      fecha_salida = NOW(),
      cerrada_por = $1,
      updated_at = NOW()
    WHERE id_ocupacion = $2
    AND id_empresa = $3
    RETURNING *;
    `,
    [id_usuario, id_ocupacion, id_empresa]
  );

  return result.rows[0];
};

export const crearPagoOcupacion = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO "Pago_ocupacion" (
      id_empresa,
      id_sucursal,
      id_ocupacion,
      metodo_pago,
      monto,
      referencia,
      estado,
      recibido_por
    )
    VALUES ($1,$2,$3,$4,$5,$6,'CONFIRMADO',$7)
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.id_sucursal,
      data.id_ocupacion,
      data.metodo_pago,
      data.monto,
      data.referencia || null,
      data.recibido_por,
    ]
  );

  return result.rows[0];
};

export const cambiarHabitacionALimpieza = async (
  client,
  id_habitacion,
  id_empresa
) => {
  const result = await client.query(
    `
    UPDATE "Habitacion"
    SET
      estado = 'LIMPIEZA',
      updated_at = NOW()
    WHERE id_habitacion = $1
    AND id_empresa = $2
    RETURNING *;
    `,
    [id_habitacion, id_empresa]
  );

  return result.rows[0];
};

export const cambiarHabitacionADisponible = async (
  client,
  id_habitacion,
  id_empresa
) => {
  const result = await client.query(
    `
    UPDATE "Habitacion"
    SET
      estado = 'DISPONIBLE',
      updated_at = NOW()
    WHERE id_habitacion = $1
    AND id_empresa = $2
    RETURNING *;
    `,
    [id_habitacion, id_empresa]
  );

  return result.rows[0];
};

export const obtenerHabitacionPorUuid = async (
  client,
  uuid_habitacion,
  id_empresa
) => {
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

export const listarHistorialOcupaciones = async (
  id_empresa,
  filters = {}
) => {
  const params = [id_empresa];

  let conditions = `
    WHERE o.id_empresa = $1
    AND o.deleted_at IS NULL
  `;

  if (filters.estado) {
    params.push(filters.estado);
    conditions += ` AND o.estado = $${params.length}`;
  }

  if (filters.id_sucursal) {
    params.push(filters.id_sucursal);
    conditions += ` AND o.id_sucursal = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      o.*,
      h.numero AS habitacion,
      s.nombre AS sucursal
    FROM "Ocupacion" o
    INNER JOIN "Habitacion" h ON h.id_habitacion = o.id_habitacion
    INNER JOIN "Sucursal" s ON s.id_sucursal = o.id_sucursal
    ${conditions}
    ORDER BY o.created_at DESC;
    `,
    params
  );

  return result.rows;
};

export const obtenerCajaAbiertaPorSucursal = async (
  client,
  id_empresa,
  id_sucursal
) => {
  const result = await client.query(
    `
    SELECT *
    FROM "Caja"
    WHERE id_empresa = $1
    AND id_sucursal = $2
    AND estado = 'ABIERTA'
    ORDER BY id_caja DESC
    LIMIT 1;
    `,
    [id_empresa, id_sucursal]
  );

  return result.rows[0] || null;
};

export const crearMovimientoCajaOcupacion = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO "Movimiento_caja" (
      id_empresa,
      id_sucursal,
      id_caja,
      id_ocupacion,
      id_pago_ocupacion,
      tipo_movimiento,
      concepto,
      descripcion,
      metodo_pago,
      monto,
      registrado_por,
      estado
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'CONFIRMADO')
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.id_sucursal,
      data.id_caja,
      data.id_ocupacion,
      data.id_pago_ocupacion,
      data.tipo_movimiento,
      data.concepto,
      data.descripcion || null,
      data.metodo_pago,
      data.monto,
      data.registrado_por,
    ]
  );

  return result.rows[0];
};
