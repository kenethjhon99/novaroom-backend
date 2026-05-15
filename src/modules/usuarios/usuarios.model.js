import { query } from "../../config/db.js";

export const listarUsuarios = async (id_empresa) => {
  const result = await query(
    `
    SELECT
      u.id_usuario,
      u.uuid_usuario,
      u.id_empresa,
      u.id_sucursal,
      u.nombres,
      u.apellidos,
      u.email,
      u.telefono,
      u.tipo_usuario,
      u.estado,
      u.ultimo_login,
      u.created_at,
      s.nombre AS sucursal,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id_rol', r.id_rol,
            'uuid_rol', r.uuid_rol,
            'nombre', r.nombre
          )
        ) FILTER (WHERE r.id_rol IS NOT NULL),
        '[]'
      ) AS roles
    FROM "Usuario" u
    LEFT JOIN "Sucursal" s ON s.id_sucursal = u.id_sucursal
    LEFT JOIN "Usuario_rol" ur ON ur.id_usuario = u.id_usuario AND ur.activo = true
    LEFT JOIN "Rol" r ON r.id_rol = ur.id_rol AND r.deleted_at IS NULL
    WHERE u.id_empresa = $1
    AND u.deleted_at IS NULL
    GROUP BY u.id_usuario, s.nombre
    ORDER BY u.created_at DESC;
    `,
    [id_empresa]
  );

  return result.rows;
};

export const obtenerUsuarioPorUuid = async (uuid_usuario, id_empresa) => {
  const result = await query(
    `
    SELECT
      u.id_usuario,
      u.uuid_usuario,
      u.id_empresa,
      u.id_sucursal,
      u.nombres,
      u.apellidos,
      u.email,
      u.telefono,
      u.tipo_usuario,
      u.estado,
      u.ultimo_login,
      u.created_at,
      s.nombre AS sucursal
    FROM "Usuario" u
    LEFT JOIN "Sucursal" s ON s.id_sucursal = u.id_sucursal
    WHERE u.uuid_usuario = $1
    AND u.id_empresa = $2
    AND u.deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_usuario, id_empresa]
  );

  return result.rows[0] || null;
};

export const obtenerUsuarioPorEmail = async (email) => {
  const result = await query(
    `
    SELECT id_usuario, uuid_usuario, email, id_empresa, estado
    FROM "Usuario"
    WHERE lower(email) = lower($1)
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [email]
  );

  return result.rows[0] || null;
};

export const validarSucursalEmpresa = async (client, id_sucursal, id_empresa) => {
  if (!id_sucursal) return true;

  const result = await client.query(
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

export const validarRolesEmpresa = async (client, roles, id_empresa) => {
  if (!roles.length) return true;
  const protectedRoleNames = ["dueño", "dueno", "super-admin", "super admin", "super_admin"];

  const result = await client.query(
    `
    SELECT COUNT(*)::int AS total
    FROM "Rol"
    WHERE id_rol = ANY($1::bigint[])
    AND id_empresa = $2
    AND estado = 'ACTIVO'
    AND lower(nombre) <> ALL($3::text[])
    AND deleted_at IS NULL;
    `,
    [roles, id_empresa, protectedRoleNames]
  );

  return result.rows[0].total === roles.length;
};

export const crearUsuario = async (client, id_empresa, data, password_hash) => {
  const result = await client.query(
    `
    INSERT INTO "Usuario" (
      id_empresa,
      id_sucursal,
      nombres,
      apellidos,
      email,
      telefono,
      password_hash,
      tipo_usuario,
      estado
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVO')
    RETURNING
      id_usuario,
      uuid_usuario,
      id_empresa,
      id_sucursal,
      nombres,
      apellidos,
      email,
      telefono,
      tipo_usuario,
      estado;
    `,
    [
      id_empresa,
      data.id_sucursal || null,
      data.nombres,
      data.apellidos || null,
      data.email,
      data.telefono || null,
      password_hash,
      data.tipo_usuario || "EMPRESA",
    ]
  );

  return result.rows[0];
};

export const actualizarUsuario = async (client, uuid_usuario, id_empresa, data) => {
  const result = await client.query(
    `
    UPDATE "Usuario"
    SET
      id_sucursal = COALESCE($1, id_sucursal),
      nombres = COALESCE($2, nombres),
      apellidos = COALESCE($3, apellidos),
      telefono = COALESCE($4, telefono),
      tipo_usuario = COALESCE($5, tipo_usuario),
      updated_at = NOW()
    WHERE uuid_usuario = $6
    AND id_empresa = $7
    AND deleted_at IS NULL
    RETURNING
      id_usuario,
      uuid_usuario,
      id_empresa,
      id_sucursal,
      nombres,
      apellidos,
      email,
      telefono,
      tipo_usuario,
      estado;
    `,
    [
      data.id_sucursal ?? null,
      data.nombres ?? null,
      data.apellidos ?? null,
      data.telefono ?? null,
      data.tipo_usuario ?? null,
      uuid_usuario,
      id_empresa,
    ]
  );

  return result.rows[0] || null;
};

export const cambiarEstadoUsuario = async (uuid_usuario, id_empresa, estado) => {
  const result = await query(
    `
    UPDATE "Usuario"
    SET estado = $1,
        updated_at = NOW()
    WHERE uuid_usuario = $2
    AND id_empresa = $3
    AND deleted_at IS NULL
    RETURNING id_usuario, uuid_usuario, nombres, email, estado;
    `,
    [estado, uuid_usuario, id_empresa]
  );

  return result.rows[0] || null;
};

export const cambiarPasswordUsuario = async (
  uuid_usuario,
  id_empresa,
  password_hash
) => {
  const result = await query(
    `
    UPDATE "Usuario"
    SET password_hash = $1,
        updated_at = NOW()
    WHERE uuid_usuario = $2
    AND id_empresa = $3
    AND deleted_at IS NULL
    RETURNING id_usuario, uuid_usuario, nombres, email, estado;
    `,
    [password_hash, uuid_usuario, id_empresa]
  );

  return result.rows[0] || null;
};

export const reemplazarRolesUsuario = async (
  client,
  id_usuario,
  id_empresa,
  id_sucursal,
  roles
) => {
  await client.query(
    `
    UPDATE "Usuario_rol"
    SET activo = false
    WHERE id_usuario = $1
    AND id_empresa = $2;
    `,
    [id_usuario, id_empresa]
  );

  for (const id_rol of roles) {
    await client.query(
      `
      INSERT INTO "Usuario_rol" (
        id_usuario,
        id_rol,
        id_empresa,
        id_sucursal,
        activo
      )
      VALUES ($1,$2,$3,$4,true)
      ON CONFLICT (id_usuario, id_rol, id_sucursal)
      DO UPDATE SET activo = true;
      `,
      [id_usuario, id_rol, id_empresa, id_sucursal || null]
    );
  }
};
