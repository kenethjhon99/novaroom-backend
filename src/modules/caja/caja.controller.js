import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import { entregarWebhooks } from "../../utils/integrationEvents.js";

import {
  obtenerCajaActualService,
  abrirCajaService,
  listarMovimientosCajaService,
  cerrarCajaService,
} from "./caja.service.js";

export const obtenerCajaActualController = asyncHandler(async (req, res) => {
  const caja = await obtenerCajaActualService(
    req.tenant.id_empresa,
    req.query.id_sucursal || req.tenant.id_sucursal
  );

  return successResponse(res, "Caja actual obtenida", caja);
});

export const abrirCajaController = asyncHandler(async (req, res) => {
  const caja = await abrirCajaService(
    req.tenant.id_empresa,
    req.body,
    req.user
  );

  void entregarWebhooks({
    id_empresa: req.tenant.id_empresa,
    id_sucursal: caja.id_sucursal,
    evento: "caja.abierta",
    payload: caja,
  }).catch((error) => console.error("webhook delivery failed", error));

  return successResponse(res, "Caja abierta correctamente", caja, 201);
});

export const listarMovimientosCajaController = asyncHandler(async (req, res) => {
  const movimientos = await listarMovimientosCajaService(
    req.tenant.id_empresa,
    req.params.idCaja
  );

  return successResponse(res, "Movimientos de caja obtenidos", movimientos);
});

export const cerrarCajaController = asyncHandler(async (req, res) => {
  const result = await cerrarCajaService(
    req.tenant.id_empresa,
    req.params.uuid,
    req.body,
    req.user
  );

  void entregarWebhooks({
    id_empresa: req.tenant.id_empresa,
    id_sucursal: result.caja?.id_sucursal || result.corte?.id_sucursal || null,
    evento: "caja.cerrada",
    payload: result,
  }).catch((error) => console.error("webhook delivery failed", error));

  return successResponse(res, "Caja cerrada correctamente", result);
});
