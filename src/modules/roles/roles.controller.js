import { successResponse } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  actualizarRolService,
  cambiarEstadoRolService,
  crearRolService,
  listarRolesService,
  obtenerRolService,
} from "./roles.service.js";

const getEmpresaScope = (req) => {
  if (req.user?.tipo_usuario === "SUPER_ADMIN" && !req.tenant.id_empresa) {
    throw new AppError(
      "Selecciona una empresa para administrar roles",
      400,
      null,
      "TENANT_COMPANY_REQUIRED"
    );
  }

  return req.tenant.id_empresa;
};

export const listarRolesController = asyncHandler(async (req, res) => {
  getEmpresaScope(req);
  const roles = await listarRolesService(req.tenant, req.user);
  return successResponse(res, "Roles obtenidos correctamente", roles);
});

export const obtenerRolController = asyncHandler(async (req, res) => {
  getEmpresaScope(req);
  const rol = await obtenerRolService(req.params.uuid, req.tenant, req.user);
  return successResponse(res, "Rol obtenido correctamente", rol);
});

export const crearRolController = asyncHandler(async (req, res) => {
  const rol = await crearRolService(getEmpresaScope(req), req.body, req.user);
  return successResponse(res, "Rol creado correctamente", rol, 201);
});

export const actualizarRolController = asyncHandler(async (req, res) => {
  const rol = await actualizarRolService(
    req.params.uuid,
    getEmpresaScope(req),
    req.body,
    req.user
  );

  return successResponse(res, "Rol actualizado correctamente", rol);
});

export const cambiarEstadoRolController = asyncHandler(async (req, res) => {
  const rol = await cambiarEstadoRolService(
    req.params.uuid,
    getEmpresaScope(req),
    req.body.estado,
    req.user
  );

  return successResponse(res, "Estado de rol actualizado", rol);
});
