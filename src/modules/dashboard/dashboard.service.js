import {
  getResumenSaas,
  getReportesSaas,
  getResumenOperativo,
  getIngresosHoy,
  getCajaActual,
  getReservasProximas,
  getOcupacionesActivas,
  getStockBajo,
  getFinanzasResumen,
  getHabitacionesMasUsadas,
} from "./dashboard.model.js";

export const dashboardSaasService = async () => {
  return getResumenSaas();
};

export const reportesSaasService = async () => {
  return getReportesSaas();
};

export const dashboardResumenService = async (id_empresa, filters) => {
  const id_sucursal = filters.id_sucursal || null;

  const [
    habitaciones,
    ingresosHoy,
    cajasAbiertas,
    reservasProximas,
    ocupacionesActivas,
    stockBajo,
    finanzas,
    habitacionesTop,
  ] = await Promise.all([
    getResumenOperativo(id_empresa, id_sucursal),
    getIngresosHoy(id_empresa, id_sucursal),
    getCajaActual(id_empresa, id_sucursal),
    getReservasProximas(id_empresa, id_sucursal),
    getOcupacionesActivas(id_empresa, id_sucursal),
    getStockBajo(id_empresa, id_sucursal),
    getFinanzasResumen(id_empresa, id_sucursal),
    getHabitacionesMasUsadas(id_empresa, id_sucursal),
  ]);

  const totalHabitaciones = Number(habitaciones.total_habitaciones || 0);
  const ocupadas = Number(habitaciones.ocupadas || 0);

  const porcentajeOcupacion =
    totalHabitaciones > 0
      ? Number(((ocupadas / totalHabitaciones) * 100).toFixed(2))
      : 0;

  return {
    habitaciones: {
      ...habitaciones,
      porcentaje_ocupacion: porcentajeOcupacion,
    },
    ingresos_hoy: {
      total: Number(ingresosHoy.ingresos_hoy || 0),
      pagos: Number(ingresosHoy.pagos_hoy || 0),
    },
    cajas_abiertas: cajasAbiertas,
    reservas_proximas: reservasProximas,
    ocupaciones_activas: ocupacionesActivas,
    stock_bajo: stockBajo,
    finanzas,
    habitaciones_top_30_dias: habitacionesTop,
  };
};

export const dashboardHabitacionesService = async (id_empresa, filters) => {
  const [habitaciones, ocupacionesActivas] = await Promise.all([
    getResumenOperativo(id_empresa, filters.id_sucursal || null),
    getOcupacionesActivas(id_empresa, filters.id_sucursal || null),
  ]);

  return {
    resumen: habitaciones,
    ocupaciones_activas: ocupacionesActivas,
  };
};

export const dashboardFinanzasService = async (id_empresa, filters) => {
  return getFinanzasResumen(id_empresa, filters.id_sucursal || null);
};

export const dashboardAlertasService = async (id_empresa, filters) => {
  const id_sucursal = filters.id_sucursal || null;

  const [stockBajo, cajasAbiertas, ocupacionesActivas, reservasProximas] =
    await Promise.all([
      getStockBajo(id_empresa, id_sucursal),
      getCajaActual(id_empresa, id_sucursal),
      getOcupacionesActivas(id_empresa, id_sucursal),
      getReservasProximas(id_empresa, id_sucursal),
    ]);

  const ocupacionesLargas = ocupacionesActivas.filter(
    (o) => Number(o.minutos_ocupada) >= 180
  );

  return {
    stock_bajo: stockBajo,
    cajas_abiertas: cajasAbiertas,
    ocupaciones_largas: ocupacionesLargas,
    reservas_proximas: reservasProximas,
  };
};

export const dashboardReservasService = async (id_empresa, filters) => {
  return getReservasProximas(id_empresa, filters.id_sucursal || null);
};
