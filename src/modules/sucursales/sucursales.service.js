import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { assertPlanLimit } from "../../utils/planLimits.js";

import {
  listarSucursales,
  obtenerSucursalPorUuid,
  contarSucursalesActivas,
  obtenerLimiteSucursales,
  crearSucursal,
  actualizarSucursal,
  cambiarEstadoSucursal,
  eliminarSucursal,
} from "./sucursales.model.js";

export const listarSucursalesService = async (id_empresa) => {
  return listarSucursales(id_empresa);
};

export const obtenerSucursalService = async (uuid_sucursal, id_empresa) => {
  const sucursal = await obtenerSucursalPorUuid(uuid_sucursal, id_empresa);

  if (!sucursal) {
    throw new AppError("Sucursal no encontrada", 404);
  }

  return sucursal;
};

export const crearSucursalService = async (id_empresa, data) => {
  return withTransaction(async (client) => {
    await assertPlanLimit({
      client,
      id_empresa,
      limitKey: "max_sucursales",
      countQuery: `
        SELECT COUNT(*)::int AS total
        FROM "Sucursal"
        WHERE id_empresa = $1
        AND deleted_at IS NULL
        AND estado = 'ACTIVA';
      `,
      countParams: [id_empresa],
    });

    const total = await contarSucursalesActivas(client, id_empresa);
    const limite = await obtenerLimiteSucursales(client, id_empresa);

    if (total >= limite) {
      throw new AppError(
        `Límite de sucursales alcanzado. Tu plan permite ${limite}.`,
        403
      );
    }

    return crearSucursal(client, id_empresa, data);
  });
};

export const actualizarSucursalService = async (uuid_sucursal, id_empresa, data) => {
  const sucursal = await actualizarSucursal(uuid_sucursal, id_empresa, data);

  if (!sucursal) {
    throw new AppError("Sucursal no encontrada", 404);
  }

  return sucursal;
};

export const cambiarEstadoSucursalService = async (uuid_sucursal, id_empresa, estado) => {
  const sucursal = await cambiarEstadoSucursal(uuid_sucursal, id_empresa, estado);

  if (!sucursal) {
    throw new AppError("Sucursal no encontrada", 404);
  }

  return sucursal;
};

export const eliminarSucursalService = async (uuid_sucursal, id_empresa) => {
  const sucursal = await eliminarSucursal(uuid_sucursal, id_empresa);

  if (!sucursal) {
    throw new AppError("Sucursal no encontrada", 404);
  }

  return sucursal;
};
