import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { emitToEmpresa, emitToSucursal } from "../../config/socket.js";

import {
  actualizarMontoOcupacion,
  cambiarHabitacionADisponible,
  cambiarHabitacionALimpieza,
  cambiarHabitacionAOcupada,
  cerrarOcupacion,
  crearHistorialHabitacion,
  crearMovimientoCajaOcupacion,
  crearOcupacion,
  crearPagoOcupacion,
  listarHistorialOcupaciones,
  listarOcupacionesActivas,
  obtenerOcupacionActivaPorUuid,
  obtenerCajaAbiertaPorSucursal,
  obtenerHabitacionParaOcupacion,
  obtenerHabitacionPorUuid,
} from "./ocupaciones.model.js";

const calcularCobroOcupacion = (ocupacion, fechaSalida = new Date()) => {
  const fechaEntrada = new Date(ocupacion.fecha_entrada);
  const tiempoMinutos = Math.max(
    1,
    Math.ceil((fechaSalida - fechaEntrada) / (1000 * 60))
  );
  const horas = Math.max(1, Math.ceil(tiempoMinutos / 60));
  const precioBase = Number(ocupacion.precio_base || 0);
  const precioExtra =
    Number(ocupacion.precio_tiempo_extra || 0) ||
    Number(ocupacion.precio_hora || 0) ||
    precioBase;

  let montoBase = precioBase;
  let montoTiempoExtra = 0;
  let horasCubiertas = 1;
  let horasExtra = 0;

  if (ocupacion.tipo_ocupacion === "POR_HORA") {
    montoBase = horas * precioBase;
    horasCubiertas = horas;
  }

  if (ocupacion.tipo_ocupacion === "COMBO_HORAS") {
    horasCubiertas = Number(ocupacion.combo_horas || 1);
    horasExtra = Math.max(0, horas - horasCubiertas);
    montoBase = precioBase;
    montoTiempoExtra = horasExtra * precioExtra;
  }

  return {
    tiempoMinutos,
    horas,
    horasCubiertas,
    horasExtra,
    montoBase,
    montoTiempoExtra,
  };
};

const isNightRateAvailable = (date = new Date()) => {
  const rawHour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: "America/Guatemala",
    }).format(date)
  );
  const hour = rawHour === 24 ? 0 : rawHour;

  return hour >= 18 || hour < 6;
};

export const abrirOcupacionService = async (id_empresa, data, user) => {
  return withTransaction(async (client) => {
    const habitacion = await obtenerHabitacionParaOcupacion(
      client,
      data.uuid_habitacion,
      id_empresa
    );

    if (!habitacion) {
      throw new AppError("Habitación no encontrada", 404);
    }

    if (habitacion.estado !== "DISPONIBLE") {
      throw new AppError(
        `La habitación no está disponible. Estado actual: ${habitacion.estado}`,
        400
      );
    }

    if (data.tipo_ocupacion === "COMBO_HORAS" && !data.combo_horas) {
      throw new AppError("Indica cuantas horas cubre el combo", 400);
    }

    if (data.tipo_ocupacion === "POR_NOCHE" && !isNightRateAvailable()) {
      throw new AppError(
        "La tarifa de noche solo esta disponible en horario nocturno",
        400,
        { tipo_ocupacion: data.tipo_ocupacion },
        "NIGHT_RATE_NOT_AVAILABLE"
      );
    }

    const precio_base =
      data.precio_base ??
      (data.tipo_ocupacion === "POR_NOCHE"
        ? Number(habitacion.precio_noche)
        : Number(habitacion.precio_hora));

    const ocupacion = await crearOcupacion(client, {
      id_empresa,
      id_sucursal: habitacion.id_sucursal,
      id_area: habitacion.id_area,
      id_habitacion: habitacion.id_habitacion,
      tipo_ocupacion: data.tipo_ocupacion,
      combo_horas: data.tipo_ocupacion === "COMBO_HORAS" ? data.combo_horas : null,
      tarifa_nombre: data.tarifa_nombre,
      precio_base,
      observaciones: data.observaciones,
      abierta_por: user.id_usuario,
    });

    await cambiarHabitacionAOcupada(
      client,
      habitacion.id_habitacion,
      id_empresa
    );

    await crearHistorialHabitacion(client, {
      id_empresa,
      id_sucursal: habitacion.id_sucursal,
      id_habitacion: habitacion.id_habitacion,
      estado_anterior: habitacion.estado,
      estado_nuevo: "OCUPADA",
      motivo: "Ocupación abierta",
      cambiado_por: user.id_usuario,
    });

    emitToEmpresa(id_empresa, "habitacion:actualizada", {
  id_empresa,
  id_sucursal: habitacion.id_sucursal,
  accion: "OCUPACION_ABIERTA",
});

emitToSucursal(habitacion.id_sucursal, "dashboard:actualizado", {
  accion: "OCUPACION_ABIERTA",
});

    return ocupacion;
  });
};

export const listarOcupacionesActivasService = async (id_empresa, id_sucursal) => {
  return listarOcupacionesActivas(id_empresa, id_sucursal);
};

export const cerrarOcupacionService = async (
  uuid_ocupacion,
  id_empresa,
  data,
  user
) => {
  return withTransaction(async (client) => {
    const ocupacion = await obtenerOcupacionActivaPorUuid(
      client,
      uuid_ocupacion,
      id_empresa
    );

    if (!ocupacion) {
      throw new AppError("Ocupación activa no encontrada", 404);
    }

    const {
      tiempoMinutos,
      horas,
      horasCubiertas,
      horasExtra,
      montoBase,
      montoTiempoExtra,
    } = calcularCobroOcupacion(ocupacion);

    const montoExtras = Number(ocupacion.monto_extras || 0);
    const montoDescuento = Number(data.descuento || 0);

    const montoTotal = Math.max(
      0,
      montoBase + montoTiempoExtra + montoExtras - montoDescuento
    );

    await actualizarMontoOcupacion(
      client,
      ocupacion.id_ocupacion,
      tiempoMinutos,
      montoBase,
      montoExtras,
      montoTiempoExtra,
      montoDescuento,
      montoTotal
    );

    const pago = await crearPagoOcupacion(client, {
      id_empresa,
      id_sucursal: ocupacion.id_sucursal,
      id_ocupacion: ocupacion.id_ocupacion,
      metodo_pago: data.metodo_pago,
      monto: montoTotal,
      referencia: data.referencia,
      recibido_por: user.id_usuario,
    });

    const cajaAbierta = await obtenerCajaAbiertaPorSucursal(
  client,
  id_empresa,
  ocupacion.id_sucursal
);

if (!cajaAbierta && data.metodo_pago !== "CORTESIA") {
  throw new AppError(
    "No hay caja abierta en esta sucursal para registrar el pago",
    400
  );
}

let movimientoCaja = null;

if (data.metodo_pago !== "CORTESIA") {
  movimientoCaja = await crearMovimientoCajaOcupacion(client, {
    id_empresa,
    id_sucursal: ocupacion.id_sucursal,
    id_caja: cajaAbierta.id_caja,
    id_ocupacion: ocupacion.id_ocupacion,
    id_pago_ocupacion: pago.id_pago_ocupacion,
    tipo_movimiento: "INGRESO_HABITACION",
    concepto: `Cobro habitación ${ocupacion.habitacion}`,
    descripcion: "Ingreso por cierre de ocupación",
    metodo_pago: data.metodo_pago,
    monto: montoTotal,
    registrado_por: user.id_usuario,
  });
}

    const ocupacionFinalizada = await cerrarOcupacion(
      client,
      ocupacion.id_ocupacion,
      id_empresa,
      user.id_usuario
    );

    const nuevoEstado = data.enviado_limpieza ? "LIMPIEZA" : "DISPONIBLE";

    if (nuevoEstado === "LIMPIEZA") {
      await cambiarHabitacionALimpieza(
        client,
        ocupacion.id_habitacion,
        id_empresa
      );
    } else {
      await cambiarHabitacionADisponible(
        client,
        ocupacion.id_habitacion,
        id_empresa
      );
    }

    await crearHistorialHabitacion(client, {
      id_empresa,
      id_sucursal: ocupacion.id_sucursal,
      id_habitacion: ocupacion.id_habitacion,
      estado_anterior: "OCUPADA",
      estado_nuevo: nuevoEstado,
      motivo: data.observaciones || "Ocupación finalizada",
      cambiado_por: user.id_usuario,
    });

    emitToEmpresa(id_empresa, "habitacion:actualizada", {
  id_empresa,
  id_sucursal: ocupacion.id_sucursal,
  accion: "OCUPACION_CERRADA",
});

emitToSucursal(ocupacion.id_sucursal, "caja:actualizada", {
  accion: "PAGO_OCUPACION",
});

emitToSucursal(ocupacion.id_sucursal, "dashboard:actualizado", {
  accion: "OCUPACION_CERRADA",
});

    return {
  ocupacion: ocupacionFinalizada,
  pago,
  movimiento_caja: movimientoCaja,
  resumen: {
    tiempo_minutos: tiempoMinutos,
    horas_cobradas: horas,
    horas_cubiertas: horasCubiertas,
    horas_extra: horasExtra,
    monto_base: montoBase,
    monto_tiempo_extra: montoTiempoExtra,
    monto_extras: montoExtras,
    monto_descuento: montoDescuento,
    monto_total: montoTotal,
  },
};
  });
};

export const finalizarLimpiezaService = async (
  uuid_habitacion,
  id_empresa,
  user,
  observaciones
) => {
  return withTransaction(async (client) => {
    const habitacion = await obtenerHabitacionPorUuid(
      client,
      uuid_habitacion,
      id_empresa
    );

    if (!habitacion) {
      throw new AppError("Habitación no encontrada", 404);
    }

    if (habitacion.estado !== "LIMPIEZA") {
      throw new AppError(
        "La habitación no está en limpieza",
        400
      );
    }

    const disponible = await cambiarHabitacionADisponible(
      client,
      habitacion.id_habitacion,
      id_empresa
    );

    await crearHistorialHabitacion(client, {
      id_empresa,
      id_sucursal: habitacion.id_sucursal,
      id_habitacion: habitacion.id_habitacion,
      estado_anterior: "LIMPIEZA",
      estado_nuevo: "DISPONIBLE",
      motivo: observaciones || "Limpieza finalizada",
      cambiado_por: user.id_usuario,
    });


    emitToEmpresa(id_empresa, "habitacion:actualizada", {
  id_empresa,
  id_sucursal: habitacion.id_sucursal,
  accion: "LIMPIEZA_FINALIZADA",
});

emitToSucursal(habitacion.id_sucursal, "dashboard:actualizado", {
  accion: "LIMPIEZA_FINALIZADA",
});

    return disponible;
  });
};

export const listarHistorialOcupacionesService = async (
  id_empresa,
  filters
) => {
  return listarHistorialOcupaciones(id_empresa, filters);
};
