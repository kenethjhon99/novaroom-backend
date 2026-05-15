import { query } from "../../config/db.js";

export const listarSuscripciones = async ({ isSuperAdmin, id_empresa }) => {
  const params = [];
  const where = ['s.deleted_at IS NULL'];

  if (!isSuperAdmin) {
    params.push(id_empresa);
    where.push(`s.id_empresa = $${params.length}`);
  }

  const result = await query(
    `
    SELECT
      s.*,
      e.nombre_comercial AS empresa,
      p.nombre AS plan
    FROM "Suscripcion" s
    INNER JOIN "Empresa" e ON e.id_empresa = s.id_empresa
    INNER JOIN "Plan" p ON p.id_plan = s.id_plan
    WHERE ${where.join(" AND ")}
    ORDER BY s.created_at DESC;
    `,
    params
  );

  return result.rows;
};

export const obtenerSuscripcionPorUuid = async (uuid_suscripcion, tenant) => {
  const params = [uuid_suscripcion];
  const where = ['s.uuid_suscripcion = $1', 's.deleted_at IS NULL'];

  if (!tenant?.isSuperAdmin) {
    params.push(tenant.id_empresa);
    where.push(`s.id_empresa = $${params.length}`);
  }

  const result = await query(
    `
    SELECT s.*, e.nombre_comercial AS empresa, p.nombre AS plan
    FROM "Suscripcion" s
    INNER JOIN "Empresa" e ON e.id_empresa = s.id_empresa
    INNER JOIN "Plan" p ON p.id_plan = s.id_plan
    WHERE ${where.join(" AND ")}
    LIMIT 1;
    `,
    params
  );

  return result.rows[0] || null;
};

export const crearSuscripcion = async (data) => {
  const result = await query(
    `
    INSERT INTO "Suscripcion" (
      id_empresa,
      id_plan,
      id_licencia,
      estado,
      ciclo,
      monto,
      moneda,
      fecha_inicio,
      fecha_fin,
      proximo_cobro,
      observaciones
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8::date, CURRENT_DATE),$9,$10,$11)
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.id_plan,
      data.id_licencia || null,
      data.estado || "ACTIVA",
      data.ciclo || "MENSUAL",
      data.monto ?? 0,
      data.moneda || "GTQ",
      data.fecha_inicio || null,
      data.fecha_fin || null,
      data.proximo_cobro || null,
      data.observaciones || null,
    ]
  );

  return result.rows[0];
};

export const actualizarSuscripcion = async (uuid_suscripcion, data) => {
  const result = await query(
    `
    UPDATE "Suscripcion"
    SET id_plan = COALESCE($1, id_plan),
        id_licencia = COALESCE($2, id_licencia),
        estado = COALESCE($3, estado),
        ciclo = COALESCE($4, ciclo),
        monto = COALESCE($5, monto),
        moneda = COALESCE($6, moneda),
        fecha_inicio = COALESCE($7::date, fecha_inicio),
        fecha_fin = $8,
        proximo_cobro = $9,
        observaciones = COALESCE($10, observaciones),
        updated_at = NOW()
    WHERE uuid_suscripcion = $11
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [
      data.id_plan ?? null,
      data.id_licencia ?? null,
      data.estado ?? null,
      data.ciclo ?? null,
      data.monto ?? null,
      data.moneda ?? null,
      data.fecha_inicio || null,
      data.fecha_fin ?? null,
      data.proximo_cobro ?? null,
      data.observaciones ?? null,
      uuid_suscripcion,
    ]
  );

  return result.rows[0] || null;
};

export const cambiarEstadoSuscripcion = async (
  uuid_suscripcion,
  estado,
  observaciones
) => {
  const result = await query(
    `
    UPDATE "Suscripcion"
    SET estado = $1,
        observaciones = COALESCE($2, observaciones),
        updated_at = NOW()
    WHERE uuid_suscripcion = $3
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [estado, observaciones || null, uuid_suscripcion]
  );

  return result.rows[0] || null;
};
