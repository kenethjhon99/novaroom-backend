import { AppError } from "../../utils/AppError.js";

import {
  listarAreas,
  obtenerAreaPorUuid,
  crearArea,
  actualizarArea,
  cambiarEstadoArea,
  eliminarArea,
} from "./areas.model.js";

export const listarAreasService = async (id_empresa, id_sucursal) => {
  return listarAreas(id_empresa, id_sucursal);
};

export const obtenerAreaService = async (uuid_area, id_empresa) => {
  const area = await obtenerAreaPorUuid(uuid_area, id_empresa);

  if (!area) {
    throw new AppError("Área no encontrada", 404);
  }

  return area;
};

export const crearAreaService = async (id_empresa, data) => {
  return crearArea(id_empresa, data);
};

export const actualizarAreaService = async (uuid_area, id_empresa, data) => {
  const area = await actualizarArea(uuid_area, id_empresa, data);

  if (!area) {
    throw new AppError("Área no encontrada", 404);
  }

  return area;
};

export const cambiarEstadoAreaService = async (uuid_area, id_empresa, activo) => {
  const area = await cambiarEstadoArea(uuid_area, id_empresa, activo);

  if (!area) {
    throw new AppError("Área no encontrada", 404);
  }

  return area;
};

export const eliminarAreaService = async (uuid_area, id_empresa) => {
  const area = await eliminarArea(uuid_area, id_empresa);

  if (!area) {
    throw new AppError("Área no encontrada", 404);
  }

  return area;
};