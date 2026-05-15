import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  actualizarDominioService,
  crearDominioService,
  eliminarDominioService,
  listarDominiosService,
  verificarDominioService,
} from "./dominios.service.js";

export const listarDominiosController = asyncHandler(async (req, res) => {
  const dominios = await listarDominiosService(req.tenant.id_empresa);
  return successResponse(res, "Dominios obtenidos correctamente", dominios);
});

export const crearDominioController = asyncHandler(async (req, res) => {
  const dominio = await crearDominioService(
    req.tenant.id_empresa,
    req.body,
    req.user
  );

  return successResponse(res, "Dominio registrado correctamente", dominio, 201);
});

export const actualizarDominioController = asyncHandler(async (req, res) => {
  const dominio = await actualizarDominioService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.body,
    req.user
  );

  return successResponse(res, "Dominio actualizado correctamente", dominio);
});

export const verificarDominioController = asyncHandler(async (req, res) => {
  const dominio = await verificarDominioService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.user
  );

  return successResponse(res, "Dominio marcado como verificado", dominio);
});

export const eliminarDominioController = asyncHandler(async (req, res) => {
  const dominio = await eliminarDominioService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.user
  );

  return successResponse(res, "Dominio eliminado correctamente", dominio);
});
