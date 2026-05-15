import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";

import {
  dashboardSaasService,
  reportesSaasService,
  dashboardResumenService,
  dashboardHabitacionesService,
  dashboardFinanzasService,
  dashboardAlertasService,
  dashboardReservasService,
} from "./dashboard.service.js";

export const dashboardSaasController = asyncHandler(async (req, res) => {
  const data = await dashboardSaasService();
  return successResponse(res, "Resumen SaaS obtenido", data);
});

export const reportesSaasController = asyncHandler(async (req, res) => {
  const data = await reportesSaasService();
  return successResponse(res, "Reportes SaaS obtenidos", data);
});

export const dashboardResumenController = asyncHandler(async (req, res) => {
  if (req.tenant?.isSuperAdmin && !req.tenant?.id_empresa) {
    const data = await dashboardSaasService();
    return successResponse(res, "Resumen SaaS obtenido", data);
  }

  const data = await dashboardResumenService(req.tenant.id_empresa, {
    id_sucursal: req.query.id_sucursal || req.tenant.id_sucursal,
  });

  return successResponse(res, "Resumen dashboard obtenido", data);
});

export const dashboardHabitacionesController = asyncHandler(async (req, res) => {
  const data = await dashboardHabitacionesService(req.tenant.id_empresa, {
    id_sucursal: req.query.id_sucursal || req.tenant.id_sucursal,
  });

  return successResponse(res, "Dashboard habitaciones obtenido", data);
});

export const dashboardFinanzasController = asyncHandler(async (req, res) => {
  const data = await dashboardFinanzasService(req.tenant.id_empresa, {
    id_sucursal: req.query.id_sucursal || req.tenant.id_sucursal,
  });

  return successResponse(res, "Dashboard finanzas obtenido", data);
});

export const dashboardAlertasController = asyncHandler(async (req, res) => {
  const data = await dashboardAlertasService(req.tenant.id_empresa, {
    id_sucursal: req.query.id_sucursal || req.tenant.id_sucursal,
  });

  return successResponse(res, "Alertas dashboard obtenidas", data);
});

export const dashboardReservasController = asyncHandler(async (req, res) => {
  const data = await dashboardReservasService(req.tenant.id_empresa, {
    id_sucursal: req.query.id_sucursal || req.tenant.id_sucursal,
  });

  return successResponse(res, "Reservas próximas obtenidas", data);
});
