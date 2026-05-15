import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";

import {
  listarNivelesService,
  obtenerNivelService,
  crearNivelService,
  actualizarNivelService,
  cambiarEstadoNivelService,
  eliminarNivelService,
} from "./niveles.service.js";

export const listarNivelesController = asyncHandler(async (req, res) => {
  const niveles = await listarNivelesService(req.tenant.id_empresa, {
    id_sucursal: req.query.id_sucursal || req.tenant.id_sucursal,
    id_area: req.query.id_area,
  });

  return successResponse(res, "Niveles obtenidos correctamente", niveles);
});

export const obtenerNivelController = asyncHandler(async (req, res) => {
  const nivel = await obtenerNivelService(req.params.uuid, req.tenant.id_empresa);

  return successResponse(res, "Nivel obtenido correctamente", nivel);
});

export const crearNivelController = asyncHandler(async (req, res) => {
  const nivel = await crearNivelService(req.tenant.id_empresa, req.body);

  return successResponse(res, "Nivel creado correctamente", nivel, 201);
});

export const actualizarNivelController = asyncHandler(async (req, res) => {
  const nivel = await actualizarNivelService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.body
  );

  return successResponse(res, "Nivel actualizado correctamente", nivel);
});

export const cambiarEstadoNivelController = asyncHandler(async (req, res) => {
  const nivel = await cambiarEstadoNivelService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.body.activo
  );

  return successResponse(res, "Estado de nivel actualizado", nivel);
});

export const eliminarNivelController = asyncHandler(async (req, res) => {
  const nivel = await eliminarNivelService(req.params.uuid, req.tenant.id_empresa);

  return successResponse(res, "Nivel eliminado correctamente", nivel);
});
