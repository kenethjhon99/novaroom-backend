import { query } from "../../config/db.js";

export const listarRoles = async ({ id_empresa, includeGlobal = false } = {}) => {
  const params = [];
  let whereScope = "r.id_empresa = $1";
  const protectedRoleNames = ["dueño", "dueno", "super-admin", "super admin", "super_admin"];

  if (includeGlobal && id_empresa) {
    params.push(id_empresa);
    whereScope = "(r.id_empresa = $1 OR r.id_empresa IS NULL)";
  } else if (includeGlobal) {
    whereScope = "r.id_empresa IS NULL";
  } else {
    params.push(id_empresa);
  }

  params.push(protectedRoleNames);

  const result = await query(
    `
    SELECT
      r.*,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id_permiso', p.id_permiso,
            'clave', p.clave,
            'modulo', p.modulo,
            'accion', p.accion
          )
        ) FILTER (WHERE p.id_permiso IS NOT NULL),
        '[]'
      ) AS permisos
    FROM "Rol" r
    LEFT JOIN "Rol_permiso" rp ON rp.id_rol = r.id_rol
    LEFT JOIN "Permiso" p ON p.id_permiso = rp.id_permiso AND p.activo = true
    WHERE ${whereScope}
    AND r.deleted_at IS NULL
    AND lower(r.nombre) <> ALL($${params.length}::text[])
    GROUP BY r.id_rol
    ORDER BY r.es_sistema DESC, r.nombre ASC;
    `,
    params
  );

  return result.rows;
};

export const obtenerRolPorUuid = async (
  uuid_rol,
  { id_empresa, includeGlobal = false } = {}
) => {
  const params = [uuid_rol];
  let whereScope = "id_empresa = $2";

  if (includeGlobal && id_empresa) {
    params.push(id_empresa);
    whereScope = "(id_empresa = $2 OR id_empresa IS NULL)";
  } else if (includeGlobal) {
    whereScope = "id_empresa IS NULL";
  } else {
    params.push(id_empresa);
  }

  const result = await query(
    `
    SELECT *
    FROM "Rol"
    WHERE uuid_rol = $1
    AND ${whereScope}
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    params
  );

  return result.rows[0] || null;
};

export const crearRol = async (client, id_empresa, data) => {
  const result = await client.query(
    `
    INSERT INTO "Rol" (
      id_empresa,
      nombre,
      descripcion,
      es_sistema,
      estado
    )
    VALUES ($1,$2,$3,false,'ACTIVO')
    RETURNING *;
    `,
    [id_empresa, data.nombre, data.descripcion || null]
  );

  return result.rows[0];
};

export const actualizarRol = async (client, uuid_rol, id_empresa, data) => {
  const result = await client.query(
    `
    UPDATE "Rol"
    SET nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        updated_at = NOW()
    WHERE uuid_rol = $3
    AND id_empresa = $4
    AND es_sistema = false
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [data.nombre ?? null, data.descripcion ?? null, uuid_rol, id_empresa]
  );

  return result.rows[0] || null;
};

export const cambiarEstadoRol = async (uuid_rol, id_empresa, estado) => {
  const result = await query(
    `
    UPDATE "Rol"
    SET estado = $1,
        updated_at = NOW()
    WHERE uuid_rol = $2
    AND id_empresa = $3
    AND es_sistema = false
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [estado, uuid_rol, id_empresa]
  );

  return result.rows[0] || null;
};

export const validarPermisos = async (client, permisos) => {
  if (!permisos.length) return true;

  const result = await client.query(
    `
    SELECT COUNT(*)::int AS total
    FROM "Permiso"
    WHERE id_permiso = ANY($1::bigint[])
    AND activo = true;
    `,
    [permisos]
  );

  return result.rows[0].total === permisos.length;
};

export const validarPermisosAsignables = async (client, permisos, { isSuperAdmin = false } = {}) => {
  if (!permisos.length) return true;

  const forbiddenModules = ["superadmin", "empresas", "planes", "licencias", "suscripciones"];
  const result = await client.query(
    `
    SELECT COUNT(*)::int AS total
    FROM "Permiso" p
    WHERE p.id_permiso = ANY($1::bigint[])
    AND p.activo = true
    ${isSuperAdmin ? "" : "AND p.modulo <> ALL($2::text[]) AND p.clave NOT LIKE '%.global'"};
    `,
    isSuperAdmin ? [permisos] : [permisos, forbiddenModules]
  );

  return result.rows[0].total === permisos.length;
};

export const reemplazarPermisosRol = async (client, id_rol, permisos) => {
  await client.query(`DELETE FROM "Rol_permiso" WHERE id_rol = $1;`, [id_rol]);

  for (const id_permiso of permisos) {
    await client.query(
      `
      INSERT INTO "Rol_permiso" (id_rol, id_permiso)
      VALUES ($1,$2)
      ON CONFLICT (id_rol, id_permiso) DO NOTHING;
      `,
      [id_rol, id_permiso]
    );
  }
};
