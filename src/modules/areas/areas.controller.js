import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";

import {
  listarAreasService,
  obtenerAreaService,
  crearAreaService,
  actualizarAreaService,
  cambiarEstadoAreaService,
  eliminarAreaService,
} from "./areas.service.js";

export const listarAreasController = asyncHandler(async (req, res) => {
  const areas = await listarAreasService(
    req.tenant.id_empresa,
    req.query.id_sucursal || req.tenant.id_sucursal
  );

  return successResponse(res, "Áreas obtenidas correctamente", areas);
});

export const obtenerAreaController = asyncHandler(async (req, res) => {
  const area = await obtenerAreaService(req.params.uuid, req.tenant.id_empresa);

  return successResponse(res, "Área obtenida correctamente", area);
});

export const crearAreaController = asyncHandler(async (req, res) => {
  const area = await crearAreaService(req.tenant.id_empresa, req.body);

  return successResponse(res, "Área creada correctamente", area, 201);
});

export const actualizarAreaController = asyncHandler(async (req, res) => {
  const area = await actualizarAreaService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.body
  );

  return successResponse(res, "Área actualizada correctamente", area);
});

export const cambiarEstadoAreaController = asyncHandler(async (req, res) => {
  const area = await cambiarEstadoAreaService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.body.activo
  );

  return successResponse(res, "Estado de área actualizado", area);
});

export const eliminarAreaController = asyncHandler(async (req, res) => {
  const area = await eliminarAreaService(req.params.uuid, req.tenant.id_empresa);

  return successResponse(res, "Área eliminada correctamente", area);
});
