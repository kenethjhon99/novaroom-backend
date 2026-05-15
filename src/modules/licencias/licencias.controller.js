import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import {
  actualizarLicenciaService,
  cambiarEstadoLicenciaService,
  crearLicenciaService,
  listarLicenciasService,
  obtenerLicenciaService,
} from "./licencias.service.js";

export const listarLicenciasController = asyncHandler(async (req, res) => {
  const licencias = await listarLicenciasService(req.tenant);
  return successResponse(res, "Licencias obtenidas correctamente", licencias);
});

export const obtenerLicenciaController = asyncHandler(async (req, res) => {
  const licencia = await obtenerLicenciaService(req.params.uuid, req.tenant);
  return successResponse(res, "Licencia obtenida correctamente", licencia);
});

export const crearLicenciaController = asyncHandler(async (req, res) => {
  const licencia = await crearLicenciaService(req.body, req.tenant, req.user);
  return successResponse(res, "Licencia creada correctamente", licencia, 201);
});

export const actualizarLicenciaController = asyncHandler(async (req, res) => {
  const licencia = await actualizarLicenciaService(
    req.params.uuid,
    req.body,
    req.tenant,
    req.user
  );
  return successResponse(res, "Licencia actualizada correctamente", licencia);
});

export const cambiarEstadoLicenciaController = asyncHandler(async (req, res) => {
  const licencia = await cambiarEstadoLicenciaService(
    req.params.uuid,
    req.body.estado,
    req.body.observaciones,
    req.tenant,
    req.user
  );
  return successResponse(res, "Estado de licencia actualizado", licencia);
});
