import { AppError } from "../../utils/AppError.js";

import {
  listarNiveles,
  obtenerNivelPorUuid,
  validarSucursalEmpresa,
  validarAreaEmpresa,
  crearNivel,
  actualizarNivel,
  cambiarEstadoNivel,
  eliminarNivel,
} from "./niveles.model.js";

export const listarNivelesService = async (id_empresa, filters) => {
  return listarNiveles(id_empresa, filters);
};

export const obtenerNivelService = async (uuid_nivel, id_empresa) => {
  const nivel = await obtenerNivelPorUuid(uuid_nivel, id_empresa);

  if (!nivel) {
    throw new AppError("Nivel no encontrado", 404);
  }

  return nivel;
};

export const crearNivelService = async (id_empresa, data) => {
  const sucursalValida = await validarSucursalEmpresa(
    data.id_sucursal,
    id_empresa
  );

  if (!sucursalValida) {
    throw new AppError("Sucursal no válida para esta empresa", 400);
  }

  if (data.id_area) {
    const areaValida = await validarAreaEmpresa(
      data.id_area,
      id_empresa,
      data.id_sucursal
    );

    if (!areaValida) {
      throw new AppError("Área no válida para esta sucursal", 400);
    }
  }

  return crearNivel(id_empresa, data);
};

export const actualizarNivelService = async (uuid_nivel, id_empresa, data) => {
  const nivelActual = await obtenerNivelPorUuid(uuid_nivel, id_empresa);

  if (!nivelActual) {
    throw new AppError("Nivel no encontrado", 404);
  }

  const id_sucursal_final = data.id_sucursal || nivelActual.id_sucursal;
  const id_area_final = data.id_area ?? nivelActual.id_area;

  const sucursalValida = await validarSucursalEmpresa(
    id_sucursal_final,
    id_empresa
  );

  if (!sucursalValida) {
    throw new AppError("Sucursal no válida para esta empresa", 400);
  }

  if (id_area_final) {
    const areaValida = await validarAreaEmpresa(
      id_area_final,
      id_empresa,
      id_sucursal_final
    );

    if (!areaValida) {
      throw new AppError("Área no válida para esta sucursal", 400);
    }
  }

  const nivel = await actualizarNivel(uuid_nivel, id_empresa, data);

  return nivel;
};

export const cambiarEstadoNivelService = async (
  uuid_nivel,
  id_empresa,
  activo
) => {
  const nivel = await cambiarEstadoNivel(uuid_nivel, id_empresa, activo);

  if (!nivel) {
    throw new AppError("Nivel no encontrado", 404);
  }

  return nivel;
};

export const eliminarNivelService = async (uuid_nivel, id_empresa) => {
  const nivel = await eliminarNivel(uuid_nivel, id_empresa);

  if (!nivel) {
    throw new AppError("Nivel no encontrado", 404);
  }

  return nivel;
};