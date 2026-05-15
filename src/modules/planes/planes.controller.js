import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import {
  actualizarPlanService,
  cambiarEstadoPlanService,
  crearPlanService,
  listarPlanesService,
  obtenerPlanService,
} from "./planes.service.js";

export const listarPlanesController = asyncHandler(async (req, res) => {
  const planes = await listarPlanesService();
  return successResponse(res, "Planes obtenidos correctamente", planes);
});

export const obtenerPlanController = asyncHandler(async (req, res) => {
  const plan = await obtenerPlanService(req.params.uuid);
  return successResponse(res, "Plan obtenido correctamente", plan);
});

export const crearPlanController = asyncHandler(async (req, res) => {
  const plan = await crearPlanService(req.body, req.user);
  return successResponse(res, "Plan creado correctamente", plan, 201);
});

export const actualizarPlanController = asyncHandler(async (req, res) => {
  const plan = await actualizarPlanService(req.params.uuid, req.body, req.user);
  return successResponse(res, "Plan actualizado correctamente", plan);
});

export const cambiarEstadoPlanController = asyncHandler(async (req, res) => {
  const plan = await cambiarEstadoPlanService(req.params.uuid, req.body.activo, req.user);
  return successResponse(res, "Estado de plan actualizado", plan);
});
