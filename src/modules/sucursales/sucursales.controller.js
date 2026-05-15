import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";

import {
  listarSucursalesService,
  obtenerSucursalService,
  crearSucursalService,
  actualizarSucursalService,
  cambiarEstadoSucursalService,
  eliminarSucursalService,
} from "./sucursales.service.js";

const getEmpresaScope = (req) => {
  if (req.user?.tipo_usuario === "SUPER_ADMIN" && !req.tenant.id_empresa) {
    throw new AppError(
      "Selecciona una empresa para administrar sucursales",
      400,
      null,
      "TENANT_COMPANY_REQUIRED"
    );
  }

  return req.tenant.id_empresa;
};

export const listarSucursalesController = asyncHandler(async (req, res) => {
  const sucursales = await listarSucursalesService(getEmpresaScope(req));

  return successResponse(res, "Sucursales obtenidas correctamente", sucursales);
});

export const obtenerSucursalController = asyncHandler(async (req, res) => {
  const sucursal = await obtenerSucursalService(
    req.params.uuid,
    getEmpresaScope(req)
  );

  return successResponse(res, "Sucursal obtenida correctamente", sucursal);
});

export const crearSucursalController = asyncHandler(async (req, res) => {
  const sucursal = await crearSucursalService(getEmpresaScope(req), req.body);

  return successResponse(res, "Sucursal creada correctamente", sucursal, 201);
});

export const actualizarSucursalController = asyncHandler(async (req, res) => {
  const sucursal = await actualizarSucursalService(
    req.params.uuid,
    getEmpresaScope(req),
    req.body
  );

  return successResponse(res, "Sucursal actualizada correctamente", sucursal);
});

export const cambiarEstadoSucursalController = asyncHandler(async (req, res) => {
  const sucursal = await cambiarEstadoSucursalService(
    req.params.uuid,
    getEmpresaScope(req),
    req.body.estado
  );

  return successResponse(res, "Estado de sucursal actualizado", sucursal);
});

export const eliminarSucursalController = asyncHandler(async (req, res) => {
  const sucursal = await eliminarSucursalService(
    req.params.uuid,
    getEmpresaScope(req)
  );

  return successResponse(res, "Sucursal eliminada correctamente", sucursal);
});
