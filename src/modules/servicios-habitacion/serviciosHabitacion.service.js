import { AppError } from "../../utils/AppError.js";

import {
  listarServiciosHabitacion,
  crearServicioHabitacion,
  actualizarServicioHabitacion,
  eliminarServicioHabitacion,
  validarHabitacionEmpresa,
  asignarServiciosHabitacion,
  listarServiciosDeHabitacion,
} from "./serviciosHabitacion.model.js";

export const listarServiciosHabitacionService = async (id_empresa) => {
  return listarServiciosHabitacion(id_empresa);
};

export const crearServicioHabitacionService = async (id_empresa, data) => {
  return crearServicioHabitacion(id_empresa, data);
};

export const actualizarServicioHabitacionService = async (
  uuid,
  id_empresa,
  data
) => {
  const servicio = await actualizarServicioHabitacion(uuid, id_empresa, data);

  if (!servicio) {
    throw new AppError("Servicio no encontrado", 404);
  }

  return servicio;
};

export const eliminarServicioHabitacionService = async (uuid, id_empresa) => {
  const servicio = await eliminarServicioHabitacion(uuid, id_empresa);

  if (!servicio) {
    throw new AppError("Servicio no encontrado", 404);
  }

  return servicio;
};

export const asignarServiciosHabitacionService = async (
  uuid_habitacion,
  id_empresa,
  servicios
) => {
  const habitacion = await validarHabitacionEmpresa(uuid_habitacion, id_empresa);

  if (!habitacion) {
    throw new AppError("Habitación no encontrada", 404);
  }

  return asignarServiciosHabitacion(
    id_empresa,
    habitacion.id_habitacion,
    servicios
  );
};

export const listarServiciosDeHabitacionService = async (
  uuid_habitacion,
  id_empresa
) => {
  return listarServiciosDeHabitacion(uuid_habitacion, id_empresa);
};