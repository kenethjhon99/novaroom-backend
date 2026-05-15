import { AppError } from "../utils/AppError.js";
import { query } from "../config/db.js";

const parsePositiveInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

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

const assertSucursalBelongsToEmpresa = async (id_sucursal, id_empresa) => {
  if (!id_sucursal) return;

  const result = await query(
    `
    SELECT id_sucursal
    FROM "Sucursal"
    WHERE id_sucursal = $1
    AND id_empresa = $2
    AND estado = 'ACTIVA'
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_sucursal, id_empresa]
  );

  if (!result.rows[0]) {
    throw new AppError(
      "No tienes acceso a esta sucursal",
      403,
      null,
      "TENANT_BRANCH_FORBIDDEN"
    );
  }
};

export const tenantMiddleware = async (req, res, next) => {
  const user = req.user;

  if (!user) {
    throw new AppError("Usuario no autenticado", 401, null, "AUTH_REQUIRED");
  }

  if (user.tipo_usuario === "SUPER_ADMIN") {
    req.tenant = {
      id_empresa: parsePositiveInt(req.headers["x-empresa-id"]),
      id_sucursal: parsePositiveInt(req.headers["x-sucursal-id"]),
      isSuperAdmin: true,
    };

    return next();
  }

  if (!user.id_empresa) {
    throw new AppError("Usuario sin empresa asignada", 403, null, "TENANT_FORBIDDEN");
  }

  const requestedSucursal =
    parsePositiveInt(req.headers["x-sucursal-id"]) ||
    parsePositiveInt(req.query.id_sucursal) ||
    parsePositiveInt(req.body?.id_sucursal);

  if (
    user.id_sucursal &&
    requestedSucursal &&
    requestedSucursal !== Number(user.id_sucursal) &&
    !isCompanyWideUser(user)
  ) {
    throw new AppError(
      "No tienes acceso a esta sucursal",
      403,
      null,
      "TENANT_BRANCH_FORBIDDEN"
    );
  }

  await assertSucursalBelongsToEmpresa(requestedSucursal, user.id_empresa);

  req.tenant = {
    id_empresa: Number(user.id_empresa),
    id_sucursal: requestedSucursal || Number(user.id_sucursal) || null,
    isSuperAdmin: false,
  };

  next();
};
