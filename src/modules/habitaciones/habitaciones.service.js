import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { assertPlanLimit } from "../../utils/planLimits.js";
import { registrarAuditoria } from "../../utils/audit.js";

import {
  listarHabitaciones,
  obtenerHabitacionPorUuid,
  validarSucursalEmpresa,
  validarAreaEmpresa,
  validarNivelEmpresa,
  contarHabitacionesActivas,
  obtenerLimiteHabitaciones,
  crearHabitacion,
  actualizarHabitacion,
  cambiarEstadoHabitacion,
  crearHistorialEstado,
  eliminarHabitacion,
  obtenerMapaHabitaciones,
} from "./habitaciones.model.js";

export const listarHabitacionesService = async (id_empresa, filters) => {
  return listarHabitaciones(id_empresa, filters);
};

export const obtenerHabitacionService = async (uuid_habitacion, id_empresa) => {
  const habitacion = await obtenerHabitacionPorUuid(uuid_habitacion, id_empresa);

  if (!habitacion) {
    throw new AppError("Habitación no encontrada", 404);
  }

  return habitacion;
};

const validarEstructuraHabitacion = async (id_empresa, data) => {
  const sucursalValida = await validarSucursalEmpresa(data.id_sucursal, id_empresa);

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

  if (data.id_nivel) {
    const nivelValido = await validarNivelEmpresa(
      data.id_nivel,
      id_empresa,
      data.id_sucursal
    );

    if (!nivelValido) {
      throw new AppError("Nivel no válido para esta sucursal", 400);
    }
  }
};

export const crearHabitacionService = async (id_empresa, data) => {
  await validarEstructuraHabitacion(id_empresa, data);

  return withTransaction(async (client) => {
    await assertPlanLimit({
      client,
      id_empresa,
      limitKey: "max_habitaciones",
      countQuery: `
        SELECT COUNT(*)::int AS total
        FROM "Habitacion"
        WHERE id_empresa = $1
        AND deleted_at IS NULL
        AND activo = true;
      `,
      countParams: [id_empresa],
    });

    const total = await contarHabitacionesActivas(client, id_empresa);
    const limite = await obtenerLimiteHabitaciones(client, id_empresa);

    if (total >= limite) {
      throw new AppError(
        `Límite de habitaciones alcanzado. Tu plan permite ${limite}.`,
        403
      );
    }

    const habitacion = await crearHabitacion(client, id_empresa, data);

    await crearHistorialEstado(client, {
      id_empresa,
      id_sucursal: habitacion.id_sucursal,
      id_habitacion: habitacion.id_habitacion,
      estado_anterior: null,
      estado_nuevo: "DISPONIBLE",
      motivo: "Habitación creada",
      cambiado_por: null,
    });

    await registrarAuditoria({
      client,
      id_empresa,
      id_sucursal: habitacion.id_sucursal,
      modulo: "habitaciones",
      tabla_afectada: "Habitacion",
      id_registro: habitacion.id_habitacion,
      accion: "HABITACION_CREADA",
      descripcion: "Habitacion creada",
      valores_nuevos: habitacion,
    });

    return habitacion;
  });
};

export const actualizarHabitacionService = async (
  uuid_habitacion,
  id_empresa,
  data
) => {
  const habitacionActual = await obtenerHabitacionPorUuid(
    uuid_habitacion,
    id_empresa
  );

  if (!habitacionActual) {
    throw new AppError("Habitación no encontrada", 404);
  }

  const dataFinal = {
    ...habitacionActual,
    ...data,
  };

  await validarEstructuraHabitacion(id_empresa, dataFinal);

  const habitacion = await actualizarHabitacion(uuid_habitacion, id_empresa, data);

  await registrarAuditoria({
    id_empresa,
    id_sucursal: habitacion.id_sucursal,
    modulo: "habitaciones",
    tabla_afectada: "Habitacion",
    id_registro: habitacion.id_habitacion,
    accion: "HABITACION_ACTUALIZADA",
    descripcion: "Habitacion actualizada",
    valores_anteriores: habitacionActual,
    valores_nuevos: habitacion,
  });

  return habitacion;
};

export const cambiarEstadoHabitacionService = async (
  uuid_habitacion,
  id_empresa,
  data,
  user
) => {
  return withTransaction(async (client) => {
    const habitacionActual = await obtenerHabitacionPorUuid(
      uuid_habitacion,
      id_empresa
    );

    if (!habitacionActual) {
      throw new AppError("Habitación no encontrada", 404);
    }

    const habitacion = await cambiarEstadoHabitacion(
      client,
      uuid_habitacion,
      id_empresa,
      data.estado
    );

    await crearHistorialEstado(client, {
      id_empresa,
      id_sucursal: habitacion.id_sucursal,
      id_habitacion: habitacion.id_habitacion,
      estado_anterior: habitacionActual.estado,
      estado_nuevo: data.estado,
      motivo: data.motivo || "Cambio de estado manual",
      cambiado_por: user?.id_usuario || null,
    });

    await registrarAuditoria({
      client,
      id_empresa,
      id_sucursal: habitacion.id_sucursal,
      id_usuario: user?.id_usuario || null,
      modulo: "habitaciones",
      tabla_afectada: "Habitacion",
      id_registro: habitacion.id_habitacion,
      accion: "HABITACION_ESTADO_CAMBIADO",
      descripcion: `Estado de habitacion cambiado a ${data.estado}`,
      valores_anteriores: habitacionActual,
      valores_nuevos: habitacion,
    });

    return habitacion;
  });
};

export const eliminarHabitacionService = async (uuid_habitacion, id_empresa) => {
  const habitacion = await eliminarHabitacion(uuid_habitacion, id_empresa);

  if (!habitacion) {
    throw new AppError("Habitación no encontrada", 404);
  }

  return habitacion;
};

export const obtenerMapaHabitacionesService = async (id_empresa, filters) => {
  const rows = await obtenerMapaHabitaciones(id_empresa, filters);

  const mapa = {};

  for (const row of rows) {
    const sucursalKey = row.uuid_sucursal;

    if (!mapa[sucursalKey]) {
      mapa[sucursalKey] = {
        id_sucursal: row.id_sucursal,
        uuid_sucursal: row.uuid_sucursal,
        nombre: row.sucursal,
        areas: {},
      };
    }

    const areaKey = row.uuid_area || "sin_area";

    if (!mapa[sucursalKey].areas[areaKey]) {
      mapa[sucursalKey].areas[areaKey] = {
        id_area: row.id_area,
        uuid_area: row.uuid_area,
        nombre: row.area || "Sin área",
        tipo_area: row.tipo_area || "PERSONALIZADA",
        niveles: {},
      };
    }

    const nivelKey = row.uuid_nivel || "sin_nivel";

    if (!mapa[sucursalKey].areas[areaKey].niveles[nivelKey]) {
      mapa[sucursalKey].areas[areaKey].niveles[nivelKey] = {
        id_nivel: row.id_nivel,
        uuid_nivel: row.uuid_nivel,
        nombre: row.nivel || "Sin nivel",
        numero: row.numero_nivel,
        habitaciones: [],
      };
    }

    mapa[sucursalKey].areas[areaKey].niveles[nivelKey].habitaciones.push({
      id_habitacion: row.id_habitacion,
      uuid_habitacion: row.uuid_habitacion,
      numero: row.numero,
      nombre: row.nombre,
      estado: row.estado,
      tipo_habitacion: row.tipo_habitacion,
      precio_hora: row.precio_hora,
      precio_noche: row.precio_noche,
      precio_tiempo_extra: row.precio_tiempo_extra,
      combo_horas: row.combo_horas,
      precio_combo_horas: row.precio_combo_horas,
      tarifa_combo_nombre: row.tarifa_combo_nombre,
      tiene_parqueo_privado: row.tiene_parqueo_privado,
      permite_reserva: row.permite_reserva,
      permite_noche: row.permite_noche,
      posicion_x: row.posicion_x,
      posicion_y: row.posicion_y,
      orden_visual: row.orden_visual,
      ocupacion_activa: row.uuid_ocupacion
        ? {
            uuid_ocupacion: row.uuid_ocupacion,
            fecha_entrada: row.fecha_entrada,
            tipo_ocupacion: row.tipo_ocupacion,
            precio_base: row.precio_base,
            combo_horas: row.combo_horas,
            tarifa_nombre: row.tarifa_nombre,
            monto_extras: row.monto_extras,
            monto_tiempo_extra: row.monto_tiempo_extra,
            monto_total: row.monto_total,
          }
        : null,
    });
  }

  return Object.values(mapa).map((sucursal) => ({
    ...sucursal,
    areas: Object.values(sucursal.areas).map((area) => ({
      ...area,
      niveles: Object.values(area.niveles),
    })),
  }));
};
