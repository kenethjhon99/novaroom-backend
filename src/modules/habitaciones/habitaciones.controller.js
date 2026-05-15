import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";

import {
  listarHabitacionesService,
  obtenerHabitacionService,
  crearHabitacionService,
  actualizarHabitacionService,
  cambiarEstadoHabitacionService,
  eliminarHabitacionService,
  obtenerMapaHabitacionesService,
} from "./habitaciones.service.js";

export const obtenerMapaHabitacionesController = asyncHandler(async (req, res) => {
  const mapa = await obtenerMapaHabitacionesService(req.tenant.id_empresa, {
    id_sucursal: req.query.id_sucursal || req.tenant.id_sucursal,
    id_area: req.query.id_area,
    id_nivel: req.query.id_nivel,
  });

  return successResponse(res, "Mapa de habitaciones obtenido correctamente", mapa);
});

export const listarHabitacionesController = asyncHandler(async (req, res) => {
  const habitaciones = await listarHabitacionesService(req.tenant.id_empresa, {
    id_sucursal: req.query.id_sucursal || req.tenant.id_sucursal,
    id_area: req.query.id_area,
    id_nivel: req.query.id_nivel,
    estado: req.query.estado,
  });

  return successResponse(
    res,
    "Habitaciones obtenidas correctamente",
    habitaciones
  );
});

export const obtenerHabitacionController = asyncHandler(async (req, res) => {
  const habitacion = await obtenerHabitacionService(
    req.params.uuid,
    req.tenant.id_empresa
  );

  return successResponse(res, "Habitación obtenida correctamente", habitacion);
});

export const crearHabitacionController = asyncHandler(async (req, res) => {
  const habitacion = await crearHabitacionService(
    req.tenant.id_empresa,
    req.body
  );

  return successResponse(res, "Habitación creada correctamente", habitacion, 201);
});

export const actualizarHabitacionController = asyncHandler(async (req, res) => {
  const habitacion = await actualizarHabitacionService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.body
  );

  return successResponse(res, "Habitación actualizada correctamente", habitacion);
});

export const cambiarEstadoHabitacionController = asyncHandler(async (req, res) => {
  const habitacion = await cambiarEstadoHabitacionService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.body,
    req.user
  );

  return successResponse(res, "Estado de habitación actualizado", habitacion);
});

export const eliminarHabitacionController = asyncHandler(async (req, res) => {
  const habitacion = await eliminarHabitacionService(
    req.params.uuid,
    req.tenant.id_empresa
  );

  return successResponse(res, "Habitación eliminada correctamente", habitacion);
});
