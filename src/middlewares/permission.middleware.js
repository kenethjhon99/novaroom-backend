import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

const isCompanyWideUser = (user) => {
  const rawType = String(user?.tipo_usuario || "").toUpperCase();
  const normalizedType = rawType
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    ["DUENO", "ADMIN_EMPRESA"].includes(normalizedType) ||
    ["DUEÃ‘O", "DUEÃƒâ€˜O"].includes(rawType)
  );
};

export const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    if (req.tenant?.isSuperAdmin) {
      return next();
    }

    const id_usuario = req.user?.id_usuario;
    const id_empresa = req.tenant?.id_empresa;
    const id_sucursal = req.tenant?.id_sucursal;
    const companyWide = isCompanyWideUser(req.user);

    const result = await query(
      `
      SELECT p.id_permiso
      FROM "Usuario_rol" ur
      INNER JOIN "Rol" r ON r.id_rol = ur.id_rol
      INNER JOIN "Rol_permiso" rp ON rp.id_rol = r.id_rol
      INNER JOIN "Permiso" p ON p.id_permiso = rp.id_permiso
      WHERE ur.id_usuario = $1
      AND ur.id_empresa = $3
      AND ($5::boolean = true OR $4::bigint IS NULL OR ur.id_sucursal IS NULL OR ur.id_sucursal = $4)
      AND ur.activo = true
      AND r.estado = 'ACTIVO'
      AND p.activo = true
      AND p.clave = $2
      LIMIT 1;
      `,
      [id_usuario, permissionKey, id_empresa, id_sucursal, companyWide]
    );

    if (!result.rows[0]) {
      throw new AppError(
        "No tienes permiso para realizar esta accion",
        403,
        { permission: permissionKey },
        "PERMISSION_DENIED"
      );
    }

    next();
  };
};

export const requireAnyPermission = (permissionKeys = []) => {
  return async (req, res, next) => {
    if (req.tenant?.isSuperAdmin) {
      return next();
    }

    const id_usuario = req.user?.id_usuario;
    const id_empresa = req.tenant?.id_empresa;
    const id_sucursal = req.tenant?.id_sucursal;
    const companyWide = isCompanyWideUser(req.user);

    const result = await query(
      `
      SELECT p.id_permiso
      FROM "Usuario_rol" ur
      INNER JOIN "Rol" r ON r.id_rol = ur.id_rol
      INNER JOIN "Rol_permiso" rp ON rp.id_rol = r.id_rol
      INNER JOIN "Permiso" p ON p.id_permiso = rp.id_permiso
      WHERE ur.id_usuario = $1
      AND ur.id_empresa = $3
      AND ($5::boolean = true OR $4::bigint IS NULL OR ur.id_sucursal IS NULL OR ur.id_sucursal = $4)
      AND ur.activo = true
      AND r.estado = 'ACTIVO'
      AND p.activo = true
      AND p.clave = ANY($2)
      LIMIT 1;
      `,
      [id_usuario, permissionKeys, id_empresa, id_sucursal, companyWide]
    );

    if (!result.rows[0]) {
      throw new AppError(
        "No tienes permiso para realizar esta accion",
        403,
        { permissions: permissionKeys },
        "PERMISSION_DENIED"
      );
    }

    next();
  };
};
