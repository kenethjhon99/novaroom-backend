import { query } from "../../config/db.js";

export const listarLicencias = async ({ isSuperAdmin, id_empresa }) => {
  const params = [];
  const where = ['l.deleted_at IS NULL'];

  if (!isSuperAdmin) {
    params.push(id_empresa);
    where.push(`l.id_empresa = $${params.length}`);
  }

  const result = await query(
    `
    SELECT
      l.*,
      e.nombre_comercial AS empresa,
      p.nombre AS plan,
      p.precio_base
    FROM "Licencia" l
    INNER JOIN "Empresa" e ON e.id_empresa = l.id_empresa
    INNER JOIN "Plan" p ON p.id_plan = l.id_plan
    WHERE ${where.join(" AND ")}
    ORDER BY l.created_at DESC;
    `,
    params
  );

  return result.rows;
};

export const obtenerLicenciaPorUuid = async (uuid_licencia, tenant) => {
  const params = [uuid_licencia];
  const where = ['l.uuid_licencia = $1', 'l.deleted_at IS NULL'];

  if (!tenant?.isSuperAdmin) {
    params.push(tenant.id_empresa);
    where.push(`l.id_empresa = $${params.length}`);
  }

  const result = await query(
    `
    SELECT l.*, e.nombre_comercial AS empresa, p.nombre AS plan
    FROM "Licencia" l
    INNER JOIN "Empresa" e ON e.id_empresa = l.id_empresa
    INNER JOIN "Plan" p ON p.id_plan = l.id_plan
    WHERE ${where.join(" AND ")}
    LIMIT 1;
    `,
    params
  );

  return result.rows[0] || null;
};

export const crearLicencia = async (data) => {
  const result = await query(
    `
    INSERT INTO "Licencia" (
      id_empresa,
      id_plan,
      fecha_inicio,
      fecha_fin,
      estado,
      observaciones
    )
    VALUES ($1,$2,COALESCE($3::date, CURRENT_DATE),$4,$5,$6)
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.id_plan,
      data.fecha_inicio || null,
      data.fecha_fin || null,
      data.estado || "ACTIVA",
      data.observaciones || null,
    ]
  );

  return result.rows[0];
};

export const actualizarLicencia = async (uuid_licencia, data) => {
  const result = await query(
    `
    UPDATE "Licencia"
    SET id_plan = COALESCE($1, id_plan),
        fecha_inicio = COALESCE($2::date, fecha_inicio),
        fecha_fin = $3,
        estado = COALESCE($4, estado),
        observaciones = COALESCE($5, observaciones),
        updated_at = NOW()
    WHERE uuid_licencia = $6
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [
      data.id_plan ?? null,
      data.fecha_inicio || null,
      data.fecha_fin ?? null,
      data.estado ?? null,
      data.observaciones ?? null,
      uuid_licencia,
    ]
  );

  return result.rows[0] || null;
};

export const cambiarEstadoLicencia = async (uuid_licencia, estado, observaciones) => {
  const result = await query(
    `
    UPDATE "Licencia"
    SET estado = $1,
        observaciones = COALESCE($2, observaciones),
        updated_at = NOW()
    WHERE uuid_licencia = $3
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [estado, observaciones || null, uuid_licencia]
  );

  return result.rows[0] || null;
};
