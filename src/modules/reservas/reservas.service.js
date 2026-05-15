import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { emitToEmpresa, emitToSucursal } from "../../config/socket.js";
import { registrarAuditoria } from "../../utils/audit.js";

import {
  obtenerHabitacionPorUuid,
  existeReservaSolapada,
  crearReserva,
  listarReservas,
  obtenerReservaPorUuid,
  confirmarReserva,
  cancelarReserva,
  crearOcupacionDesdeReserva,
  marcarReservaCheckin,
  cambiarHabitacionEstado,
  crearHistorialHabitacion,
} from "./reservas.model.js";

export const crearReservaService = async (id_empresa, data, user) => {
  return withTransaction(async (client) => {
    const habitacion = await obtenerHabitacionPorUuid(
      client,
      data.uuid_habitacion,
      id_empresa
    );

    if (!habitacion) {
      throw new AppError("Habitación no encontrada", 404);
    }

    const inicio = new Date(data.fecha_inicio);
    const fin = new Date(data.fecha_fin);

    if (fin <= inicio) {
      throw new AppError("La fecha fin debe ser mayor que la fecha inicio", 400);
    }

    const solapada = await existeReservaSolapada(
      client,
      id_empresa,
      habitacion.id_habitacion,
      inicio,
      fin
    );

    if (solapada) {
      throw new AppError("Ya existe una reserva para esa habitación en ese horario", 400);
    }

    const reserva = await crearReserva(client, {
  id_empresa,
  id_sucursal: habitacion.id_sucursal,
  id_area: habitacion.id_area,
  id_habitacion: habitacion.id_habitacion,
  nombre_cliente: data.nombre_cliente,
  telefono_cliente: data.telefono_cliente,
  tipo_reserva: data.tipo_reserva,
  fecha_inicio: inicio,
  fecha_fin: fin,
  monto_estimado: data.monto_estimado,
  anticipo: data.anticipo,
  observaciones: data.observaciones,
  creada_por: user.id_usuario,
});

emitToEmpresa(id_empresa, "reserva:actualizada", {
  id_empresa,
  id_sucursal: habitacion.id_sucursal,
  accion: "RESERVA_CREADA",
});

emitToSucursal(habitacion.id_sucursal, "dashboard:actualizado", {
  accion: "RESERVA_CREADA",
});

await registrarAuditoria({
  client,
  id_empresa,
  id_sucursal: habitacion.id_sucursal,
  id_usuario: user?.id_usuario || null,
  modulo: "reservas",
  tabla_afectada: "Reserva",
  id_registro: reserva.id_reserva,
  accion: "RESERVA_CREADA",
  descripcion: "Reserva creada",
  valores_nuevos: reserva,
});

return reserva;
  });
};

export const listarReservasService = async (id_empresa, filters) => {
  return listarReservas(id_empresa, filters);
};

export const confirmarReservaService = async (uuid_reserva, id_empresa, user) => {
  return withTransaction(async (client) => {
    const reserva = await confirmarReserva(
      client,
      uuid_reserva,
      id_empresa,
      user.id_usuario
    );

    if (!reserva) {
      throw new AppError("Reserva pendiente no encontrada", 404);
    }

    await registrarAuditoria({
      client,
      id_empresa,
      id_sucursal: reserva.id_sucursal,
      id_usuario: user?.id_usuario || null,
      modulo: "reservas",
      tabla_afectada: "Reserva",
      id_registro: reserva.id_reserva,
      accion: "RESERVA_CONFIRMADA",
      descripcion: "Reserva confirmada",
      valores_nuevos: reserva,
    });
    emitToEmpresa(id_empresa, "reserva:actualizada", {
  id_empresa,
  accion: "RESERVA_ACTUALIZADA",
});

emitToEmpresa(id_empresa, "habitacion:actualizada", {
  id_empresa,
  accion: "RESERVA_ACTUALIZADA",
});

emitToEmpresa(id_empresa, "dashboard:actualizado", {
  id_empresa,
  accion: "RESERVA_ACTUALIZADA",
});

    return reserva;
  });
};

export const cancelarReservaService = async (uuid_reserva, id_empresa, data, user) => {
  return withTransaction(async (client) => {
    const reserva = await cancelarReserva(
      client,
      uuid_reserva,
      id_empresa,
      user.id_usuario,
      data.motivo
    );

    if (!reserva) {
      throw new AppError("Reserva no encontrada o no cancelable", 404);
    }

    emitToEmpresa(id_empresa, "reserva:actualizada", {
  id_empresa,
  accion: "RESERVA_ACTUALIZADA",
});

emitToEmpresa(id_empresa, "habitacion:actualizada", {
  id_empresa,
  accion: "RESERVA_ACTUALIZADA",
});

emitToEmpresa(id_empresa, "dashboard:actualizado", {
  id_empresa,
  accion: "RESERVA_ACTUALIZADA",
});

    await registrarAuditoria({
      client,
      id_empresa,
      id_sucursal: reserva.id_sucursal,
      id_usuario: user?.id_usuario || null,
      modulo: "reservas",
      tabla_afectada: "Reserva",
      id_registro: reserva.id_reserva,
      accion: "RESERVA_CANCELADA",
      descripcion: data.motivo || "Reserva cancelada",
      valores_nuevos: reserva,
    });
    return reserva;
  });
};

export const checkinReservaService = async (uuid_reserva, id_empresa, data, user) => {
  return withTransaction(async (client) => {
    const reserva = await obtenerReservaPorUuid(client, uuid_reserva, id_empresa);

    if (!reserva) {
      throw new AppError("Reserva no encontrada", 404);
    }

    if (!["PENDIENTE", "CONFIRMADA"].includes(reserva.estado)) {
      throw new AppError("La reserva no puede hacer check-in", 400);
    }

    if (reserva.estado_habitacion !== "DISPONIBLE" && reserva.estado_habitacion !== "RESERVADA") {
      throw new AppError(
        `La habitación no está disponible. Estado actual: ${reserva.estado_habitacion}`,
        400
      );
    }

    const ocupacion = await crearOcupacionDesdeReserva(
      client,
      reserva,
      user.id_usuario,
      data.observaciones
    );

    await marcarReservaCheckin(client, uuid_reserva, id_empresa);

    await cambiarHabitacionEstado(
      client,
      reserva.id_habitacion,
      id_empresa,
      "OCUPADA"
    );

    await crearHistorialHabitacion(client, {
      id_empresa,
      id_sucursal: reserva.id_sucursal,
      id_habitacion: reserva.id_habitacion,
      estado_anterior: reserva.estado_habitacion,
      estado_nuevo: "OCUPADA",
      motivo: "Check-in desde reserva",
      cambiado_por: user.id_usuario,
    });

    await registrarAuditoria({
      client,
      id_empresa,
      id_sucursal: reserva.id_sucursal,
      id_usuario: user?.id_usuario || null,
      modulo: "reservas",
      tabla_afectada: "Reserva",
      id_registro: reserva.id_reserva,
      accion: "RESERVA_CHECKIN",
      descripcion: "Check-in desde reserva",
      valores_nuevos: { reserva_uuid: uuid_reserva, ocupacion },
    });


    emitToEmpresa(id_empresa, "reserva:actualizada", {
  id_empresa,
  accion: "RESERVA_ACTUALIZADA",
});

emitToEmpresa(id_empresa, "habitacion:actualizada", {
  id_empresa,
  accion: "RESERVA_ACTUALIZADA",
});

emitToEmpresa(id_empresa, "dashboard:actualizado", {
  id_empresa,
  accion: "RESERVA_ACTUALIZADA",
});


    return {
      reserva_uuid: uuid_reserva,
      ocupacion,
    };
  });
};
