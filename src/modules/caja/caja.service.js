import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { emitToEmpresa, emitToSucursal } from "../../config/socket.js";
import { registrarAuditoria } from "../../utils/audit.js";

import {
  obtenerCajaAbierta,
  crearCaja,
  listarMovimientosCaja,
  calcularTotalesCaja,
  cerrarCaja,
  crearCorteCaja,
} from "./caja.model.js";

export const obtenerCajaActualService = async (id_empresa, id_sucursal) => {
  const caja = await obtenerCajaAbierta(id_empresa, id_sucursal);

  if (!caja) {
    throw new AppError("No hay caja abierta en esta sucursal", 404);
  }

  return caja;
};

export const abrirCajaService = async (id_empresa, data, user) => {
  return withTransaction(async (client) => {
    const existente = await obtenerCajaAbierta(id_empresa, data.id_sucursal);

    if (existente) {
      throw new AppError("Ya existe una caja abierta en esta sucursal", 400);
    }

    const caja = await crearCaja(client, {
      id_empresa,
      id_sucursal: data.id_sucursal,
      abierta_por: user.id_usuario,
      monto_inicial: data.monto_inicial || 0,
      observaciones_apertura: data.observaciones_apertura,
    });

    await registrarAuditoria({
      client,
      id_empresa,
      id_sucursal: data.id_sucursal,
      id_usuario: user?.id_usuario || null,
      modulo: "caja",
      tabla_afectada: "Caja",
      id_registro: caja.id_caja,
      accion: "CAJA_ABIERTA",
      descripcion: "Caja abierta",
      valores_nuevos: caja,
    });

    emitToSucursal(data.id_sucursal, "caja:actualizada", {
      accion: "CAJA_ABIERTA",
    });

    emitToEmpresa(id_empresa, "dashboard:actualizado", {
      accion: "CAJA_ABIERTA",
    });

    return caja;
  });
};

export const listarMovimientosCajaService = async (id_empresa, id_caja) => {
  return listarMovimientosCaja(id_empresa, id_caja);
};

export const cerrarCajaService = async (id_empresa, uuid_caja, data, user) => {
  return withTransaction(async (client) => {
    const result = await client.query(
      `
      SELECT *
      FROM "Caja"
      WHERE uuid_caja = $1
      AND id_empresa = $2
      AND estado = 'ABIERTA'
      LIMIT 1;
      `,
      [uuid_caja, id_empresa]
    );

    const caja = result.rows[0];

    if (!caja) {
      throw new AppError("Caja abierta no encontrada", 404);
    }

    const totales = await calcularTotalesCaja(client, id_empresa, caja.id_caja);

    const totalIngresos = Number(totales.total_ingresos || 0);
    const totalEgresos = Number(totales.total_egresos || 0);
    const montoInicial = Number(caja.monto_inicial || 0);

    const montoEsperado = montoInicial + totalIngresos - totalEgresos;
    const montoReal = Number(data.monto_real);
    const diferencia = montoReal - montoEsperado;

    const cajaCerrada = await cerrarCaja(client, {
      id_empresa,
      id_caja: caja.id_caja,
      cerrada_por: user.id_usuario,
      monto_esperado: montoEsperado,
      monto_real: montoReal,
      diferencia,
      observaciones_cierre: data.observaciones_cierre,
    });

    const corte = await crearCorteCaja(client, {
      id_empresa,
      id_sucursal: caja.id_sucursal,
      id_caja: caja.id_caja,
      total_ingresos: totalIngresos,
      total_egresos: totalEgresos,
      total_efectivo: Number(totales.total_efectivo || 0),
      total_tarjeta: Number(totales.total_tarjeta || 0),
      total_transferencia: Number(totales.total_transferencia || 0),
      monto_inicial: montoInicial,
      monto_esperado: montoEsperado,
      monto_real: montoReal,
      diferencia,
      cerrado_por: user.id_usuario,
      observaciones: data.observaciones_cierre,
    });

    await registrarAuditoria({
      client,
      id_empresa,
      id_sucursal: caja.id_sucursal,
      id_usuario: user?.id_usuario || null,
      modulo: "caja",
      tabla_afectada: "Caja",
      id_registro: caja.id_caja,
      accion: "CAJA_CERRADA",
      descripcion: "Caja cerrada y corte generado",
      valores_anteriores: caja,
      valores_nuevos: { caja: cajaCerrada, corte },
    });
    emitToSucursal(caja.id_sucursal, "caja:actualizada", {
  accion: "CAJA_CERRADA",
});

emitToEmpresa(id_empresa, "dashboard:actualizado", {
  accion: "CAJA_CERRADA",
});

    return {
      caja: cajaCerrada,
      corte,
      resumen: {
        total_ingresos: totalIngresos,
        total_egresos: totalEgresos,
        monto_inicial: montoInicial,
        monto_esperado: montoEsperado,
        monto_real: montoReal,
        diferencia,
      },
    };
  });
};
