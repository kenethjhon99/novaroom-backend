import { createHash } from "crypto";

import { query } from "../../config/db.js";
import { getEmpresaLimitesOrNull } from "../../utils/planLimits.js";

export const hashToken = (token) => {
  return createHash("sha256").update(token).digest("hex");
};

export const findUserByEmail = async (email) => {
  const result = await query(
    `
    SELECT
      id_usuario,
      uuid_usuario,
      id_empresa,
      id_sucursal,
      nombres,
      apellidos,
      email,
      password_hash,
      tipo_usuario,
      estado
    FROM "Usuario"
    WHERE email = $1
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [email]
  );

  return result.rows[0] || null;
};

export const updateLastLogin = async (id_usuario) => {
  await query(
    `
    UPDATE "Usuario"
    SET ultimo_login = NOW(),
        updated_at = NOW()
    WHERE id_usuario = $1;
    `,
    [id_usuario]
  );
};

export const createUserSession = async ({ id_usuario, token, ip, user_agent }) => {
  await query(
    `
    INSERT INTO "Sesion_usuario" (
      id_usuario,
      token_hash,
      ip,
      user_agent,
      activa
    )
    VALUES ($1, $2, $3, $4, true);
    `,
    [id_usuario, hashToken(token), ip || null, user_agent || null]
  );
};

export const createRefreshToken = async ({
  id_usuario,
  refresh_token,
  expires_at,
  ip,
  user_agent,
}) => {
  await query(
    `
    INSERT INTO "Refresh_token" (
      id_usuario,
      token_hash,
      expires_at,
      ip,
      user_agent
    )
    VALUES ($1, $2, $3, $4, $5);
    `,
    [
      id_usuario,
      hashToken(refresh_token),
      expires_at,
      ip || null,
      user_agent || null,
    ]
  );
};

export const revokeUserSession = async (token) => {
  await query(
    `
    UPDATE "Sesion_usuario"
    SET activa = false,
        fecha_fin = NOW()
    WHERE token_hash = $1
    AND activa = true;
    `,
    [hashToken(token)]
  );
};

export const revokeRefreshToken = async (refresh_token) => {
  await query(
    `
    UPDATE "Refresh_token"
    SET revoked_at = NOW()
    WHERE token_hash = $1
    AND revoked_at IS NULL;
    `,
    [hashToken(refresh_token)]
  );
};

export const isSessionActive = async (token) => {
  const result = await query(
    `
    SELECT id_sesion
    FROM "Sesion_usuario"
    WHERE token_hash = $1
    AND activa = true
    LIMIT 1;
    `,
    [hashToken(token)]
  );

  return !!result.rows[0];
};

export const findActiveRefreshToken = async (refresh_token) => {
  const result = await query(
    `
    SELECT
      rt.id_refresh_token,
      rt.id_usuario,
      rt.expires_at,
      u.uuid_usuario,
      u.id_empresa,
      u.id_sucursal,
      u.email,
      u.tipo_usuario,
      u.estado
    FROM "Refresh_token" rt
    INNER JOIN "Usuario" u ON u.id_usuario = rt.id_usuario
    WHERE rt.token_hash = $1
    AND rt.revoked_at IS NULL
    AND rt.expires_at > NOW()
    AND u.deleted_at IS NULL
    LIMIT 1;
    `,
    [hashToken(refresh_token)]
  );

  return result.rows[0] || null;
};

const isCompanyOwnerType = (tipo_usuario) => {
  const rawType = String(tipo_usuario || "").toUpperCase();
  const normalizedType = rawType
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    ["DUENO", "ADMIN_EMPRESA"].includes(normalizedType) ||
    ["DUEÃ‘O", "DUEÃƒâ€˜O"].includes(rawType)
  );
};

export const getUserContext = async (id_usuario) => {
  const userResult = await query(
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
      e.uuid_empresa,
      e.nombre_comercial AS empresa,
      s.uuid_sucursal,
      s.nombre AS sucursal
    FROM "Usuario" u
    LEFT JOIN "Empresa" e ON e.id_empresa = u.id_empresa
    LEFT JOIN "Sucursal" s ON s.id_sucursal = u.id_sucursal
    WHERE u.id_usuario = $1
    AND u.deleted_at IS NULL
    LIMIT 1;
    `,
    [id_usuario]
  );

  const user = userResult.rows[0] || null;

  if (!user) {
    return null;
  }

  if (user.tipo_usuario === "SUPER_ADMIN") {
    return {
      user,
      roles: [],
      permissions: ["*"],
      modules: ["*"],
      sucursales: [],
    };
  }

  const [
    rolesResult,
    permissionsResult,
    modulesResult,
    sucursalesResult,
    limites,
  ] =
    await Promise.all([
      query(
        `
        SELECT DISTINCT
          r.id_rol,
          r.uuid_rol,
          r.nombre,
          r.descripcion,
          ur.id_sucursal
        FROM "Usuario_rol" ur
        INNER JOIN "Rol" r ON r.id_rol = ur.id_rol
        WHERE ur.id_usuario = $1
        AND ur.id_empresa = $2
        AND ur.activo = true
        AND r.estado = 'ACTIVO';
        `,
        [id_usuario, user.id_empresa]
      ),
      query(
        `
        SELECT DISTINCT p.clave
        FROM "Usuario_rol" ur
        INNER JOIN "Rol" r ON r.id_rol = ur.id_rol
        INNER JOIN "Rol_permiso" rp ON rp.id_rol = r.id_rol
        INNER JOIN "Permiso" p ON p.id_permiso = rp.id_permiso
        WHERE ur.id_usuario = $1
        AND ur.id_empresa = $2
        AND ur.activo = true
        AND r.estado = 'ACTIVO'
        AND p.activo = true
        ORDER BY p.clave ASC;
        `,
        [id_usuario, user.id_empresa]
      ),
      query(
        `
        SELECT DISTINCT m.clave
        FROM "Empresa_modulo" em
        INNER JOIN "Modulo" m ON m.id_modulo = em.id_modulo
        WHERE em.id_empresa = $1
        AND em.activo = true
        AND m.activo = true
        ORDER BY m.clave ASC;
        `,
        [user.id_empresa]
      ),
      query(
        `
        SELECT
          id_sucursal,
          uuid_sucursal,
          nombre,
          estado
        FROM "Sucursal"
        WHERE id_empresa = $1
        AND deleted_at IS NULL
        AND estado = 'ACTIVA'
        ORDER BY nombre ASC;
        `,
        [user.id_empresa]
      ),
      getEmpresaLimitesOrNull({ query }, user.id_empresa),
    ]);

  const hasGlobalCompanyRole = rolesResult.rows.some((role) => !role.id_sucursal);
  const canManageBranches =
    hasGlobalCompanyRole ||
    isCompanyOwnerType(user.tipo_usuario) ||
    ["DUEÑO", "ADMIN_EMPRESA"].includes(user.tipo_usuario) ||
    permissionsResult.rows.some((row) =>
      ["sucursales.ver", "sucursales.crear", "sucursales.editar"].includes(row.clave)
    );

  return {
    user,
    roles: rolesResult.rows,
    permissions: permissionsResult.rows.map((row) => row.clave),
    modules: modulesResult.rows.map((row) => row.clave),
    sucursales: user.id_sucursal && !canManageBranches
      ? sucursalesResult.rows.filter(
          (sucursal) => Number(sucursal.id_sucursal) === Number(user.id_sucursal)
        )
      : sucursalesResult.rows,
    limites,
  };
};
