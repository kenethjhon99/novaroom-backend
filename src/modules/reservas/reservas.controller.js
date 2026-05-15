import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import { entregarWebhooks } from "../../utils/integrationEvents.js";

import {
  crearReservaService,
  listarReservasService,
  confirmarReservaService,
  cancelarReservaService,
  checkinReservaService,
} from "./reservas.service.js";

export const crearReservaController = asyncHandler(async (req, res) => {
  const reserva = await crearReservaService(
    req.tenant.id_empresa,
    req.body,
    req.user
  );

  void entregarWebhooks({
    id_empresa: req.tenant.id_empresa,
    id_sucursal: reserva.id_sucursal,
    evento: "reserva.creada",
    payload: reserva,
  }).catch((error) => console.error("webhook delivery failed", error));

  return successResponse(res, "Reserva creada correctamente", reserva, 201);
});

export const listarReservasController = asyncHandler(async (req, res) => {
  const reservas = await listarReservasService(req.tenant.id_empresa, {
    estado: req.query.estado,
    id_sucursal: req.query.id_sucursal || req.tenant.id_sucursal,
  });

  return successResponse(res, "Reservas obtenidas correctamente", reservas);
});

export const confirmarReservaController = asyncHandler(async (req, res) => {
  const reserva = await confirmarReservaService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.user
  );

  void entregarWebhooks({
    id_empresa: req.tenant.id_empresa,
    id_sucursal: reserva.id_sucursal,
    evento: "reserva.confirmada",
    payload: reserva,
  }).catch((error) => console.error("webhook delivery failed", error));

  return successResponse(res, "Reserva confirmada correctamente", reserva);
});

export const cancelarReservaController = asyncHandler(async (req, res) => {
  const reserva = await cancelarReservaService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.body,
    req.user
  );

  void entregarWebhooks({
    id_empresa: req.tenant.id_empresa,
    id_sucursal: reserva.id_sucursal,
    evento: "reserva.cancelada",
    payload: reserva,
  }).catch((error) => console.error("webhook delivery failed", error));

  return successResponse(res, "Reserva cancelada correctamente", reserva);
});

export const checkinReservaController = asyncHandler(async (req, res) => {
  const result = await checkinReservaService(
    req.params.uuid,
    req.tenant.id_empresa,
    req.body,
    req.user
  );

  void entregarWebhooks({
    id_empresa: req.tenant.id_empresa,
    id_sucursal: result.ocupacion?.id_sucursal || null,
    evento: "checkin.realizado",
    payload: result,
  }).catch((error) => console.error("webhook delivery failed", error));

  return successResponse(res, "Check-in realizado correctamente", result);
});
