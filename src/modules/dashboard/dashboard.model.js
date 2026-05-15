import { query } from "../../config/db.js";

const tableExists = async (tableName) => {
  const result = await query("SELECT to_regclass($1) IS NOT NULL AS exists;", [
    `public."${tableName}"`,
  ]);
  return Boolean(result.rows[0]?.exists);
};

const countRows = async (tableName, where = "TRUE") => {
  if (!(await tableExists(tableName))) {
    return 0;
  }

  const result = await query(
    `SELECT COUNT(*)::int AS total FROM "${tableName}" WHERE ${where};`
  );

  return result.rows[0]?.total || 0;
};

export const getResumenSaas = async () => {
  const [
    empresasTotal,
    empresasActivas,
    sucursalesActivas,
    usuariosActivos,
    licenciasActivas,
    licenciasNoActivas,
    suscripcionesActivas,
    dominiosActivos,
    apiKeysActivas,
    webhooksActivos,
  ] = await Promise.all([
    countRows("Empresa", "deleted_at IS NULL"),
    countRows("Empresa", "deleted_at IS NULL AND estado = 'ACTIVA'"),
    countRows("Sucursal", "deleted_at IS NULL AND estado = 'ACTIVA'"),
    countRows("Usuario", "deleted_at IS NULL AND estado = 'ACTIVO'"),
    countRows("Licencia", "deleted_at IS NULL AND estado = 'ACTIVA'"),
    countRows("Licencia", "deleted_at IS NULL AND estado <> 'ACTIVA'"),
    countRows("Suscripcion", "deleted_at IS NULL AND estado = 'ACTIVA'"),
    countRows("Empresa_dominio", "deleted_at IS NULL AND estado = 'ACTIVO'"),
    countRows("Api_key", "activo = true"),
    countRows("Webhook_empresa", "activo = true"),
  ]);

  const empresasResult = await query(
    `
    SELECT
      e.id_empresa,
      e.uuid_empresa,
      e.nombre_comercial,
      e.estado,
      p.nombre AS plan,
      l.estado AS licencia,
      e.created_at
    FROM "Empresa" e
    LEFT JOIN "Licencia" l ON l.id_empresa = e.id_empresa AND l.deleted_at IS NULL
    LEFT JOIN "Plan" p ON p.id_plan = l.id_plan
    WHERE e.deleted_at IS NULL
    ORDER BY e.created_at DESC
    LIMIT 8;
    `
  );

  const planesResult = await query(
    `
    SELECT
      p.nombre,
      COUNT(l.id_licencia)::int AS empresas
    FROM "Plan" p
    LEFT JOIN "Licencia" l ON l.id_plan = p.id_plan AND l.deleted_at IS NULL
    WHERE p.deleted_at IS NULL
    GROUP BY p.id_plan, p.nombre
    ORDER BY empresas DESC, p.nombre ASC;
    `
  );

  return {
    totales: {
      empresas_total: empresasTotal,
      empresas_activas: empresasActivas,
      sucursales_activas: sucursalesActivas,
      usuarios_activos: usuariosActivos,
      licencias_activas: licenciasActivas,
      licencias_no_activas: licenciasNoActivas,
      suscripciones_activas: suscripcionesActivas,
      dominios_activos: dominiosActivos,
      api_keys_activas: apiKeysActivas,
      webhooks_activos: webhooksActivos,
    },
    empresas_recientes: empresasResult.rows,
    empresas_por_plan: planesResult.rows,
  };
};

const safeRows = async (tableName, sql, params = []) => {
  if (!(await tableExists(tableName))) {
    return [];
  }

  const result = await query(sql, params);
  return result.rows;
};

const integrationRows = async () => [
  {
    tipo: "API keys activas",
    total: await countRows("Api_key", "activo = true"),
  },
  {
    tipo: "Webhooks activos",
    total: await countRows("Webhook_empresa", "activo = true"),
  },
];

export const getReportesSaas = async () => {
  const resumen = await getResumenSaas();

  const [
    crecimientoEmpresas,
    licenciasPorEstado,
    suscripcionesPorEstado,
    ingresoEstimado,
    dominiosPorEstado,
    integraciones,
    modulosMasActivos,
  ] = await Promise.all([
    safeRows(
      "Empresa",
      `
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS periodo,
        COUNT(*)::int AS empresas
      FROM "Empresa"
      WHERE deleted_at IS NULL
      AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY periodo ASC;
      `
    ),
    safeRows(
      "Licencia",
      `
      SELECT estado, COUNT(*)::int AS total
      FROM "Licencia"
      WHERE deleted_at IS NULL
      GROUP BY estado
      ORDER BY total DESC, estado ASC;
      `
    ),
    safeRows(
      "Suscripcion",
      `
      SELECT estado, COUNT(*)::int AS total
      FROM "Suscripcion"
      WHERE deleted_at IS NULL
      GROUP BY estado
      ORDER BY total DESC, estado ASC;
      `
    ),
    safeRows(
      "Suscripcion",
      `
      SELECT
        COALESCE(SUM(CASE
          WHEN estado = 'ACTIVA' AND ciclo = 'ANUAL' THEN monto / 12
          WHEN estado = 'ACTIVA' THEN monto
          ELSE 0
        END), 0)::numeric AS mrr_estimado,
        COALESCE(SUM(CASE
          WHEN estado = 'ACTIVA' AND ciclo = 'ANUAL' THEN monto
          WHEN estado = 'ACTIVA' THEN monto * 12
          ELSE 0
        END), 0)::numeric AS arr_estimado
      FROM "Suscripcion"
      WHERE deleted_at IS NULL;
      `
    ),
    safeRows(
      "Empresa_dominio",
      `
      SELECT estado, COUNT(*)::int AS total
      FROM "Empresa_dominio"
      WHERE deleted_at IS NULL
      GROUP BY estado
      ORDER BY total DESC, estado ASC;
      `
    ),
    integrationRows(),
    safeRows(
      "Empresa_modulo",
      `
      SELECT
        m.nombre,
        m.clave,
        COUNT(em.id_empresa_modulo)::int AS empresas
      FROM "Empresa_modulo" em
      INNER JOIN "Modulo" m ON m.id_modulo = em.id_modulo
      WHERE em.activo = true
      AND m.deleted_at IS NULL
      GROUP BY m.id_modulo, m.nombre, m.clave
      ORDER BY empresas DESC, m.nombre ASC
      LIMIT 12;
      `
    ),
  ]);

  return {
    ...resumen,
    crecimiento_empresas: crecimientoEmpresas,
    licencias_por_estado: licenciasPorEstado,
    suscripciones_por_estado: suscripcionesPorEstado,
    ingresos: ingresoEstimado[0] || { mrr_estimado: 0, arr_estimado: 0 },
    dominios_por_estado: dominiosPorEstado,
    integraciones,
    modulos_mas_activos: modulosMasActivos,
  };
};

export const getResumenOperativo = async (id_empresa, id_sucursal = null) => {
  const params = [id_empresa];
  let sucursalFilter = "";

  if (id_sucursal) {
    params.push(id_sucursal);
    sucursalFilter = `AND id_sucursal = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      COUNT(*) FILTER (WHERE estado = 'DISPONIBLE')::int AS disponibles,
      COUNT(*) FILTER (WHERE estado = 'OCUPADA')::int AS ocupadas,
      COUNT(*) FILTER (WHERE estado = 'LIMPIEZA')::int AS limpieza,
      COUNT(*) FILTER (WHERE estado = 'MANTENIMIENTO')::int AS mantenimiento,
      COUNT(*) FILTER (WHERE estado = 'RESERVADA')::int AS reservadas,
      COUNT(*) FILTER (WHERE estado = 'BLOQUEADA')::int AS bloqueadas,
      COUNT(*)::int AS total_habitaciones
    FROM "Habitacion"
    WHERE id_empresa = $1
    ${sucursalFilter}
    AND deleted_at IS NULL
    AND activo = true;
    `,
    params
  );

  return result.rows[0];
};

export const getIngresosHoy = async (id_empresa, id_sucursal = null) => {
  const params = [id_empresa];
  let sucursalFilter = "";

  if (id_sucursal) {
    params.push(id_sucursal);
    sucursalFilter = `AND id_sucursal = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      COALESCE(SUM(monto), 0)::numeric AS ingresos_hoy,
      COUNT(*)::int AS pagos_hoy
    FROM "Pago_ocupacion"
    WHERE id_empresa = $1
    ${sucursalFilter}
    AND estado = 'CONFIRMADO'
    AND created_at::date = CURRENT_DATE;
    `,
    params
  );

  return result.rows[0];
};

export const getCajaActual = async (id_empresa, id_sucursal = null) => {
  const params = [id_empresa];
  let sucursalFilter = "";

  if (id_sucursal) {
    params.push(id_sucursal);
    sucursalFilter = `AND c.id_sucursal = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      c.*,
      s.nombre AS sucursal,
      u.nombres || ' ' || COALESCE(u.apellidos, '') AS abierta_por_nombre
    FROM "Caja" c
    INNER JOIN "Sucursal" s ON s.id_sucursal = c.id_sucursal
    LEFT JOIN "Usuario" u ON u.id_usuario = c.abierta_por
    WHERE c.id_empresa = $1
    ${sucursalFilter}
    AND c.estado = 'ABIERTA'
    ORDER BY c.fecha_apertura DESC;
    `,
    params
  );

  return result.rows;
};

export const getReservasProximas = async (id_empresa, id_sucursal = null) => {
  const params = [id_empresa];
  let sucursalFilter = "";

  if (id_sucursal) {
    params.push(id_sucursal);
    sucursalFilter = `AND r.id_sucursal = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      r.uuid_reserva,
      r.nombre_cliente,
      r.telefono_cliente,
      r.tipo_reserva,
      r.estado,
      r.fecha_inicio,
      r.fecha_fin,
      r.monto_estimado,
      r.anticipo,
      h.numero AS habitacion,
      s.nombre AS sucursal
    FROM "Reserva" r
    INNER JOIN "Habitacion" h ON h.id_habitacion = r.id_habitacion
    INNER JOIN "Sucursal" s ON s.id_sucursal = r.id_sucursal
    WHERE r.id_empresa = $1
    ${sucursalFilter}
    AND r.deleted_at IS NULL
    AND r.estado IN ('PENDIENTE', 'CONFIRMADA')
    AND r.fecha_inicio >= NOW()
    ORDER BY r.fecha_inicio ASC
    LIMIT 10;
    `,
    params
  );

  return result.rows;
};

export const getOcupacionesActivas = async (id_empresa, id_sucursal = null) => {
  const params = [id_empresa];
  let sucursalFilter = "";

  if (id_sucursal) {
    params.push(id_sucursal);
    sucursalFilter = `AND o.id_sucursal = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      o.uuid_ocupacion,
      o.tipo_ocupacion,
      o.fecha_entrada,
      o.precio_base,
      o.monto_extras,
      o.monto_total,
      h.uuid_habitacion,
      h.numero AS habitacion,
      s.nombre AS sucursal,
      a.nombre AS area,
      EXTRACT(EPOCH FROM (NOW() - o.fecha_entrada)) / 60 AS minutos_ocupada
    FROM "Ocupacion" o
    INNER JOIN "Habitacion" h ON h.id_habitacion = o.id_habitacion
    INNER JOIN "Sucursal" s ON s.id_sucursal = o.id_sucursal
    LEFT JOIN "Area" a ON a.id_area = o.id_area
    WHERE o.id_empresa = $1
    ${sucursalFilter}
    AND o.estado = 'ACTIVA'
    AND o.deleted_at IS NULL
    ORDER BY o.fecha_entrada ASC;
    `,
    params
  );

  return result.rows;
};

export const getStockBajo = async (id_empresa, id_sucursal = null) => {
  const params = [id_empresa];
  let sucursalFilter = "";

  if (id_sucursal) {
    params.push(id_sucursal);
    sucursalFilter = `AND i.id_sucursal = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      p.nombre AS producto,
      p.tipo_producto,
      i.existencia,
      i.stock_minimo,
      b.nombre AS bodega,
      s.nombre AS sucursal
    FROM "Inventario" i
    INNER JOIN "Producto" p ON p.id_producto = i.id_producto
    INNER JOIN "Bodega" b ON b.id_bodega = i.id_bodega
    INNER JOIN "Sucursal" s ON s.id_sucursal = i.id_sucursal
    WHERE i.id_empresa = $1
    ${sucursalFilter}
    AND i.existencia <= i.stock_minimo
    AND p.deleted_at IS NULL
    ORDER BY i.existencia ASC
    LIMIT 20;
    `,
    params
  );

  return result.rows;
};

export const getFinanzasResumen = async (id_empresa, id_sucursal = null) => {
  const params = [id_empresa];
  let sucursalFilterPagos = "";
  let sucursalFilterGastos = "";

  if (id_sucursal) {
    params.push(id_sucursal);
    sucursalFilterPagos = `AND po.id_sucursal = $${params.length}`;
    sucursalFilterGastos = `AND gg.id_sucursal = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      (
        SELECT COALESCE(SUM(po.monto), 0)
        FROM "Pago_ocupacion" po
        WHERE po.id_empresa = $1
        ${sucursalFilterPagos}
        AND po.estado = 'CONFIRMADO'
        AND po.created_at::date = CURRENT_DATE
      ) AS ingresos_dia,

      (
        SELECT COALESCE(SUM(po.monto), 0)
        FROM "Pago_ocupacion" po
        WHERE po.id_empresa = $1
        ${sucursalFilterPagos}
        AND po.estado = 'CONFIRMADO'
        AND DATE_TRUNC('month', po.created_at) = DATE_TRUNC('month', NOW())
      ) AS ingresos_mes,

      (
        SELECT COALESCE(SUM(gg.monto), 0)
        FROM "Gasto_general" gg
        WHERE gg.id_empresa = $1
        ${sucursalFilterGastos}
        AND gg.deleted_at IS NULL
        AND DATE_TRUNC('month', gg.fecha_gasto) = DATE_TRUNC('month', CURRENT_DATE)
      ) AS gastos_mes;
    `,
    params
  );

  const row = result.rows[0];

  return {
    ingresos_dia: Number(row.ingresos_dia || 0),
    ingresos_mes: Number(row.ingresos_mes || 0),
    gastos_mes: Number(row.gastos_mes || 0),
    utilidad_estimada_mes:
      Number(row.ingresos_mes || 0) - Number(row.gastos_mes || 0),
  };
};

export const getHabitacionesMasUsadas = async (id_empresa, id_sucursal = null) => {
  const params = [id_empresa];
  let sucursalFilter = "";

  if (id_sucursal) {
    params.push(id_sucursal);
    sucursalFilter = `AND o.id_sucursal = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      h.numero AS habitacion,
      h.nombre,
      COUNT(o.id_ocupacion)::int AS usos,
      COALESCE(SUM(o.monto_total), 0)::numeric AS ingresos
    FROM "Ocupacion" o
    INNER JOIN "Habitacion" h ON h.id_habitacion = o.id_habitacion
    WHERE o.id_empresa = $1
    ${sucursalFilter}
    AND o.deleted_at IS NULL
    AND o.estado = 'FINALIZADA'
    AND o.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY h.id_habitacion, h.numero, h.nombre
    ORDER BY usos DESC
    LIMIT 10;
    `,
    params
  );

  return result.rows;
};
