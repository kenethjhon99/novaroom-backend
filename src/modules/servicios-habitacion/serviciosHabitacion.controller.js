import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";

import {
  listarServiciosHabitacionService,
  crearServicioHabitacionService,
  actualizarServicioHabitacionService,
  eliminarServicioHabitacionService,
  asignarServiciosHabitacionService,
  listarServiciosDeHabitacionService,
} from "./serviciosHabitacion.service.js";

export const listarServiciosHabitacionController = asyncHandler(async (req, res) => {
  const servicios = await listarServiciosHabitacionService(req.tenant.id_empresa);
  return successResponse(res, "Servicios obtenidos", servicios);
});

export const crearServicioHabitacionController = asyncHandler(async (req, res) => {
  const servicio = await crearServicioHabitacionService(
    req.tenant.id_empresa,
    req.body
  );

  return successResponse(res, "Servicio creado", servicio, 201);
});

export const actualizarServicioHabitacionController = asyncHandler(
  async (req, res) => {
    const servicio = await actualizarServicioHabitacionService(
      req.params.uuid,
      req.tenant.id_empresa,
      req.body
    );

    return successResponse(res, "Servicio actualizado", servicio);
  }
);

export const eliminarServicioHabitacionController = asyncHandler(async (req, res) => {
  const servicio = await eliminarServicioHabitacionService(
    req.params.uuid,
    req.tenant.id_empresa
  );

  return successResponse(res, "Servicio eliminado", servicio);
});

export const asignarServiciosHabitacionController = asyncHandler(async (req, res) => {
  const servicios = await asignarServiciosHabitacionService(
    req.params.uuidHabitacion,
    req.tenant.id_empresa,
    req.body.servicios
  );

  return successResponse(res, "Servicios asignados a habitación", servicios);
});

export const listarServiciosDeHabitacionController = asyncHandler(async (req, res) => {
  const servicios = await listarServiciosDeHabitacionService(
    req.params.uuidHabitacion,
    req.tenant.id_empresa
  );

  return successResponse(res, "Servicios de habitación obtenidos", servicios);
});