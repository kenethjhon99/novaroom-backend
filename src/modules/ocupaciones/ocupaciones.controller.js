import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";

import {
  abrirOcupacionService,
  cerrarOcupacionService,
  finalizarLimpiezaService,
  listarHistorialOcupacionesService,
  listarOcupacionesActivasService,
} from "./ocupaciones.service.js";

export const abrirOcupacionController = asyncHandler(async (req, res) => {
  const ocupacion = await abrirOcupacionService(
    req.tenant.id_empresa,
    req.body,
    req.user
  );

  return successResponse(res, "Habitación ocupada correctamente", ocupacion, 201);
});

export const listarOcupacionesActivasController = asyncHandler(async (req, res) => {
  const ocupaciones = await listarOcupacionesActivasService(
    req.tenant.id_empresa,
    req.query.id_sucursal || req.tenant.id_sucursal
  );

  return successResponse(res, "Ocupaciones activas obtenidas", ocupaciones);
});

export const cerrarOcupacionController = asyncHandler(async (req, res) => {
  const ocupacion = await cerrarOcupacionService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.body,
    req.user
  );

  return successResponse(
    res,
    "Ocupación cerrada correctamente",
    ocupacion
  );
});

export const finalizarLimpiezaController = asyncHandler(async (req, res) => {
  const habitacion = await finalizarLimpiezaService(
    req.params.uuidHabitacion,
    req.tenant.id_empresa,
    req.user,
    req.body.observaciones
  );

  return successResponse(
    res,
    "Limpieza finalizada correctamente",
    habitacion
  );
});

export const listarHistorialOcupacionesController = asyncHandler(
  async (req, res) => {
    const historial = await listarHistorialOcupacionesService(
      req.tenant.id_empresa,
      {
        estado: req.query.estado,
        id_sucursal: req.query.id_sucursal || req.tenant.id_sucursal,
      }
    );

    return successResponse(
      res,
      "Historial de ocupaciones obtenido",
      historial
    );
  }
);
