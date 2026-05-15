import { query } from "../../config/db.js";

export const obtenerCajaAbierta = async (id_empresa, id_sucursal) => {
  const result = await query(
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

export const crearCaja = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO "Caja" (
      id_empresa,
      id_sucursal,
      abierta_por,
      estado,
      monto_inicial,
      monto_esperado,
      observaciones_apertura
    )
    VALUES ($1,$2,$3,'ABIERTA',$4,$4,$5)
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.id_sucursal,
      data.abierta_por,
      data.monto_inicial,
      data.observaciones_apertura || null,
    ]
  );

  return result.rows[0];
};

export const listarMovimientosCaja = async (id_empresa, id_caja) => {
  const result = await query(
    `
    SELECT *
    FROM "Movimiento_caja"
    WHERE id_empresa = $1
    AND id_caja = $2
    ORDER BY created_at DESC;
    `,
    [id_empresa, id_caja]
  );

  return result.rows;
};

export const crearMovimientoCaja = async (client, data) => {
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
      data.id_ocupacion || null,
      data.id_pago_ocupacion || null,
      data.tipo_movimiento,
      data.concepto,
      data.descripcion || null,
      data.metodo_pago || "EFECTIVO",
      data.monto,
      data.registrado_por || null,
    ]
  );

  return result.rows[0];
};

export const calcularTotalesCaja = async (client, id_empresa, id_caja) => {
  const result = await client.query(
    `
    SELECT
      COALESCE(SUM(CASE WHEN tipo_movimiento LIKE 'INGRESO%' THEN monto ELSE 0 END),0) AS total_ingresos,
      COALESCE(SUM(CASE WHEN tipo_movimiento IN ('EGRESO','RETIRO','DEVOLUCION','AJUSTE_NEGATIVO') THEN monto ELSE 0 END),0) AS total_egresos,
      COALESCE(SUM(CASE WHEN metodo_pago = 'EFECTIVO' AND tipo_movimiento LIKE 'INGRESO%' THEN monto ELSE 0 END),0) AS total_efectivo,
      COALESCE(SUM(CASE WHEN metodo_pago = 'TARJETA' THEN monto ELSE 0 END),0) AS total_tarjeta,
      COALESCE(SUM(CASE WHEN metodo_pago = 'TRANSFERENCIA' THEN monto ELSE 0 END),0) AS total_transferencia
    FROM "Movimiento_caja"
    WHERE id_empresa = $1
    AND id_caja = $2
    AND estado = 'CONFIRMADO';
    `,
    [id_empresa, id_caja]
  );

  return result.rows[0];
};

export const cerrarCaja = async (client, data) => {
  const result = await client.query(
    `
    UPDATE "Caja"
    SET
      estado = 'CERRADA',
      cerrada_por = $1,
      monto_esperado = $2,
      monto_real = $3,
      diferencia = $4,
      fecha_cierre = NOW(),
      observaciones_cierre = $5,
      updated_at = NOW()
    WHERE id_caja = $6
    AND id_empresa = $7
    RETURNING *;
    `,
    [
      data.cerrada_por,
      data.monto_esperado,
      data.monto_real,
      data.diferencia,
      data.observaciones_cierre || null,
      data.id_caja,
      data.id_empresa,
    ]
  );

  return result.rows[0];
};

export const crearCorteCaja = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO "Corte_caja" (
      id_empresa,
      id_sucursal,
      id_caja,
      total_ingresos,
      total_egresos,
      total_efectivo,
      total_tarjeta,
      total_transferencia,
      monto_inicial,
      monto_esperado,
      monto_real,
      diferencia,
      cerrado_por,
      estado,
      observaciones
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'PENDIENTE_REVISION',$14)
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.id_sucursal,
      data.id_caja,
      data.total_ingresos,
      data.total_egresos,
      data.total_efectivo,
      data.total_tarjeta,
      data.total_transferencia,
      data.monto_inicial,
      data.monto_esperado,
      data.monto_real,
      data.diferencia,
      data.cerrado_por,
      data.observaciones || null,
    ]
  );

  return result.rows[0];
};