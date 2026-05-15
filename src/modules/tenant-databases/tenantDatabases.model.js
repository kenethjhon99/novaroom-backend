import { query } from "../../config/db.js";

export const listarTenantDatabases = async (tenant) => {
  const params = [];
  const where = ['td.deleted_at IS NULL'];

  if (!tenant?.isSuperAdmin) {
    params.push(tenant.id_empresa);
    where.push(`td.id_empresa = $${params.length}`);
  }

  const result = await query(
    `
    SELECT
      td.*,
      e.nombre_comercial AS empresa,
      e.estado AS empresa_estado,
      el.permite_bd_exclusiva
    FROM "Tenant_database" td
    INNER JOIN "Empresa" e ON e.id_empresa = td.id_empresa
    LEFT JOIN "Empresa_limite" el ON el.id_empresa = td.id_empresa
    WHERE ${where.join(" AND ")}
    ORDER BY td.created_at DESC;
    `,
    params
  );

  return result.rows;
};

export const obtenerTenantDatabasePorUuid = async (uuid_tenant_database, tenant) => {
  const params = [uuid_tenant_database];
  const where = ['td.uuid_tenant_database = $1', 'td.deleted_at IS NULL'];

  if (!tenant?.isSuperAdmin) {
    params.push(tenant.id_empresa);
    where.push(`td.id_empresa = $${params.length}`);
  }

  const result = await query(
    `
    SELECT td.*, e.nombre_comercial AS empresa, el.permite_bd_exclusiva
    FROM "Tenant_database" td
    INNER JOIN "Empresa" e ON e.id_empresa = td.id_empresa
    LEFT JOIN "Empresa_limite" el ON el.id_empresa = td.id_empresa
    WHERE ${where.join(" AND ")}
    LIMIT 1;
    `,
    params
  );

  return result.rows[0] || null;
};

export const crearTenantDatabase = async (client, data, creado_por) => {
  const result = await client.query(
    `
    INSERT INTO "Tenant_database" (
      id_empresa,
      tipo,
      proveedor,
      estado,
      connection_ref,
      database_name,
      region,
      ssl_required,
      migracion_estado,
      migracion_version,
      notas,
      creado_por
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.tipo || "DEDICADA",
      data.proveedor || "NEON",
      data.estado || "PENDIENTE",
      data.connection_ref || null,
      data.database_name || null,
      data.region || null,
      data.ssl_required ?? true,
      data.migracion_estado || "NO_INICIADA",
      data.migracion_version || null,
      data.notas || null,
      creado_por || null,
    ]
  );

  return result.rows[0];
};

export const actualizarTenantDatabase = async (uuid_tenant_database, data) => {
  const result = await query(
    `
    UPDATE "Tenant_database"
    SET proveedor = COALESCE($1, proveedor),
        estado = COALESCE($2, estado),
        connection_ref = COALESCE($3, connection_ref),
        database_name = COALESCE($4, database_name),
        region = COALESCE($5, region),
        ssl_required = COALESCE($6, ssl_required),
        migracion_estado = COALESCE($7, migracion_estado),
        migracion_version = COALESCE($8, migracion_version),
        ultimo_backup_at = COALESCE($9, ultimo_backup_at),
        health_status = COALESCE($10, health_status),
        last_health_check_at = CASE
          WHEN $10 IS NOT NULL THEN NOW()
          ELSE last_health_check_at
        END,
        activated_at = CASE
          WHEN $2 = 'ACTIVA' AND activated_at IS NULL THEN NOW()
          ELSE activated_at
        END,
        notas = COALESCE($11, notas),
        updated_at = NOW()
    WHERE uuid_tenant_database = $12
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [
      data.proveedor ?? null,
      data.estado ?? null,
      data.connection_ref ?? null,
      data.database_name ?? null,
      data.region ?? null,
      data.ssl_required ?? null,
      data.migracion_estado ?? null,
      data.migracion_version ?? null,
      data.ultimo_backup_at ?? null,
      data.health_status ?? null,
      data.notas ?? null,
      uuid_tenant_database,
    ]
  );

  return result.rows[0] || null;
};
