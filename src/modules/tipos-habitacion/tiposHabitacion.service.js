import { AppError } from "../../utils/AppError.js";
import {
  listarTiposHabitacion,
  crearTipoHabitacion,
  actualizarTipoHabitacion,
  eliminarTipoHabitacion,
} from "./tiposHabitacion.model.js";

export const listarTiposHabitacionService = async (id_empresa) => {
  return listarTiposHabitacion(id_empresa);
};

export const crearTipoHabitacionService = async (id_empresa, data) => {
  return crearTipoHabitacion(id_empresa, data);
};

export const actualizarTipoHabitacionService = async (uuid, id_empresa, data) => {
  const tipo = await actualizarTipoHabitacion(uuid, id_empresa, data);

  if (!tipo) {
    throw new AppError("Tipo de habitación no encontrado", 404);
  }

  return tipo;
};

export const eliminarTipoHabitacionService = async (uuid, id_empresa) => {
  const tipo = await eliminarTipoHabitacion(uuid, id_empresa);

  if (!tipo) {
    throw new AppError("Tipo de habitación no encontrado", 404);
  }

  return tipo;
};