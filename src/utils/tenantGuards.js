import { query } from "../config/db.js";
import { AppError } from "./AppError.js";

const exists = async (sql, params, code, message) => {
  const result = await query(sql, params);

  if (!result.rows[0]) {
    throw new AppError(message, 403, null, code);
  }

  return result.rows[0];
};

export const ensureSucursalEmpresa = (id_sucursal, id_empresa) => {
  return exists(
    `
    SELECT id_sucursal
    FROM "Sucursal"
    WHERE id_sucursal = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_sucursal, id_empresa],
    "TENANT_BRANCH_FORBIDDEN",
    "Sucursal fuera del tenant"
  );
};

export const ensureHabitacionEmpresa = (uuid_habitacion, id_empresa) => {
  return exists(
    `
    SELECT id_habitacion, id_sucursal
    FROM "Habitacion"
    WHERE uuid_habitacion = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_habitacion, id_empresa],
    "TENANT_RESOURCE_FORBIDDEN",
    "Habitacion fuera del tenant"
  );
};

export const ensureCajaEmpresa = (id_caja, id_empresa) => {
  return exists(
    `
    SELECT id_caja, id_sucursal
    FROM "Caja"
    WHERE id_caja = $1
    AND id_empresa = $2
    LIMIT 1;
    `,
    [id_caja, id_empresa],
    "TENANT_RESOURCE_FORBIDDEN",
    "Caja fuera del tenant"
  );
};

export const ensureReservaEmpresa = (uuid_reserva, id_empresa) => {
  return exists(
    `
    SELECT id_reserva, id_sucursal
    FROM "Reserva"
    WHERE uuid_reserva = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_reserva, id_empresa],
    "TENANT_RESOURCE_FORBIDDEN",
    "Reserva fuera del tenant"
  );
};

export const ensureOcupacionEmpresa = (uuid_ocupacion, id_empresa) => {
  return exists(
    `
    SELECT id_ocupacion, id_sucursal
    FROM "Ocupacion"
    WHERE uuid_ocupacion = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_ocupacion, id_empresa],
    "TENANT_RESOURCE_FORBIDDEN",
    "Ocupacion fuera del tenant"
  );
};

export const ensureProductoEmpresa = (id_producto, id_empresa) => {
  return exists(
    `
    SELECT id_producto
    FROM "Producto"
    WHERE id_producto = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_producto, id_empresa],
    "TENANT_RESOURCE_FORBIDDEN",
    "Producto fuera del tenant"
  );
};

export const ensureBodegaEmpresa = (id_bodega, id_empresa) => {
  return exists(
    `
    SELECT id_bodega, id_sucursal
    FROM "Bodega"
    WHERE id_bodega = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_bodega, id_empresa],
    "TENANT_RESOURCE_FORBIDDEN",
    "Bodega fuera del tenant"
  );
};
