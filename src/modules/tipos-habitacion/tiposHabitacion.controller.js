import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";

import {
  listarTiposHabitacionService,
  crearTipoHabitacionService,
  actualizarTipoHabitacionService,
  eliminarTipoHabitacionService,
} from "./tiposHabitacion.service.js";

export const listarTiposHabitacionController = asyncHandler(async (req, res) => {
  const tipos = await listarTiposHabitacionService(req.tenant.id_empresa);
  return successResponse(res, "Tipos de habitación obtenidos", tipos);
});

export const crearTipoHabitacionController = asyncHandler(async (req, res) => {
  const tipo = await crearTipoHabitacionService(req.tenant.id_empresa, req.body);
  return successResponse(res, "Tipo de habitación creado", tipo, 201);
});

export const actualizarTipoHabitacionController = asyncHandler(async (req, res) => {
  const tipo = await actualizarTipoHabitacionService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.body
  );

  return successResponse(res, "Tipo de habitación actualizado", tipo);
});

export const eliminarTipoHabitacionController = asyncHandler(async (req, res) => {
  const tipo = await eliminarTipoHabitacionService(
    req.params.uuid,
    req.tenant.id_empresa
  );

  return successResponse(res, "Tipo de habitación eliminado", tipo);
});