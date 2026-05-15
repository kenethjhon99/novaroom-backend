import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import {
  actualizarSuscripcionService,
  cambiarEstadoSuscripcionService,
  crearSuscripcionService,
  listarSuscripcionesService,
  obtenerSuscripcionService,
} from "./suscripciones.service.js";

export const listarSuscripcionesController = asyncHandler(async (req, res) => {
  const suscripciones = await listarSuscripcionesService(req.tenant);
  return successResponse(res, "Suscripciones obtenidas correctamente", suscripciones);
});

export const obtenerSuscripcionController = asyncHandler(async (req, res) => {
  const suscripcion = await obtenerSuscripcionService(req.params.uuid, req.tenant);
  return successResponse(res, "Suscripcion obtenida correctamente", suscripcion);
});

export const crearSuscripcionController = asyncHandler(async (req, res) => {
  const suscripcion = await crearSuscripcionService(req.body, req.tenant, req.user);
  return successResponse(res, "Suscripcion creada correctamente", suscripcion, 201);
});

export const actualizarSuscripcionController = asyncHandler(async (req, res) => {
  const suscripcion = await actualizarSuscripcionService(
    req.params.uuid,
    req.body,
    req.tenant,
    req.user
  );
  return successResponse(res, "Suscripcion actualizada correctamente", suscripcion);
});

export const cambiarEstadoSuscripcionController = asyncHandler(async (req, res) => {
  const suscripcion = await cambiarEstadoSuscripcionService(
    req.params.uuid,
    req.body.estado,
    req.body.observaciones,
    req.tenant,
    req.user
  );
  return successResponse(res, "Estado de suscripcion actualizado", suscripcion);
});
