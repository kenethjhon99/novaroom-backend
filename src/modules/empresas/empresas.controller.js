import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";

import {
  listarEmpresasService,
  obtenerEmpresaService,
  crearEmpresaCompletaService,
} from "./empresas.service.js";

export const listarEmpresasController = asyncHandler(async (req, res) => {
  const empresas = await listarEmpresasService(req.tenant);

  return successResponse(res, "Empresas obtenidas correctamente", empresas);
});

export const obtenerEmpresaController = asyncHandler(async (req, res) => {
  const empresa = await obtenerEmpresaService(req.params.uuid, req.tenant);

  return successResponse(res, "Empresa obtenida correctamente", empresa);
});

export const crearEmpresaController = asyncHandler(async (req, res) => {
  const result = await crearEmpresaCompletaService(req.body, req.user);

  return successResponse(res, "Empresa creada correctamente", result, 201);
});
