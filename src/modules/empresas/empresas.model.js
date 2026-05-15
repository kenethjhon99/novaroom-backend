import { query } from "../../config/db.js";

export const listarEmpresas = async () => {
  const result = await query(`
    SELECT 
      e.id_empresa,
      e.uuid_empresa,
      e.nombre_comercial,
      e.razon_social,
      e.nit,
      e.telefono,
      e.email,
      e.estado,
      l.estado AS estado_licencia,
      p.nombre AS plan,
      e.created_at
    FROM "Empresa" e
    LEFT JOIN "Licencia" l ON l.id_empresa = e.id_empresa
    LEFT JOIN "Plan" p ON p.id_plan = l.id_plan
    WHERE e.deleted_at IS NULL
    ORDER BY e.created_at DESC;
  `);

  return result.rows;
};

export const obtenerEmpresaPorUuid = async (uuid_empresa) => {
  const result = await query(
    `
    SELECT 
      e.*,
      l.id_licencia,
      l.estado AS estado_licencia,
      l.fecha_inicio,
      l.fecha_fin,
      p.id_plan,
      p.nombre AS plan
    FROM "Empresa" e
    LEFT JOIN "Licencia" l ON l.id_empresa = e.id_empresa
    LEFT JOIN "Plan" p ON p.id_plan = l.id_plan
    WHERE e.uuid_empresa = $1
    AND e.deleted_at IS NULL
    ORDER BY l.id_licencia DESC
    LIMIT 1;
    `,
    [uuid_empresa]
  );

  return result.rows[0] || null;
};

export const obtenerEmpresaPorId = async (id_empresa) => {
  const result = await query(
    `
    SELECT
      e.*,
      l.id_licencia,
      l.estado AS estado_licencia,
      l.fecha_inicio,
      l.fecha_fin,
      p.id_plan,
      p.nombre AS plan
    FROM "Empresa" e
    LEFT JOIN "Licencia" l ON l.id_empresa = e.id_empresa
    LEFT JOIN "Plan" p ON p.id_plan = l.id_plan
    WHERE e.id_empresa = $1
    AND e.deleted_at IS NULL
    ORDER BY l.id_licencia DESC
    LIMIT 1;
    `,
    [id_empresa]
  );

  return result.rows[0] || null;
};

export const obtenerPlanPorId = async (client, id_plan) => {
  const result = await client.query(
    `
    SELECT *
    FROM "Plan"
    WHERE id_plan = $1
    AND activo = true
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_plan]
  );

  return result.rows[0] || null;
};

export const crearEmpresa = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO "Empresa" (
      nombre_comercial,
      razon_social,
      nit,
      telefono,
      email,
      direccion,
      estado
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVA')
    RETURNING *;
    `,
    [
      data.nombre_comercial,
      data.razon_social || null,
      data.nit || null,
      data.telefono || null,
      data.email || null,
      data.direccion || null,
    ]
  );

  return result.rows[0];
};

export const crearSucursalPrincipal = async (client, id_empresa, sucursal) => {
  const result = await client.query(
    `
    INSERT INTO "Sucursal" (
      id_empresa,
      nombre,
      direccion,
      telefono,
      whatsapp,
      email,
      estado
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVA')
    RETURNING *;
    `,
    [
      id_empresa,
      sucursal.nombre,
      sucursal.direccion || null,
      sucursal.telefono || null,
      sucursal.whatsapp || null,
      sucursal.email || null,
    ]
  );

  return result.rows[0];
};

export const crearLicencia = async (client, id_empresa, id_plan) => {
  const result = await client.query(
    `
    INSERT INTO "Licencia" (
      id_empresa,
      id_plan,
      fecha_inicio,
      estado
    )
    VALUES ($1, $2, CURRENT_DATE, 'ACTIVA')
    RETURNING *;
    `,
    [id_empresa, id_plan]
  );

  return result.rows[0];
};

export const crearLimitesEmpresa = async (client, id_empresa, plan) => {
  let limits = {
    max_sucursales: 1,
    max_habitaciones: 20,
    max_usuarios: 5,
    max_roles: 3,
    almacenamiento_gb: 5,
    permite_bd_exclusiva: false,
    permite_dominio_propio: false,
    permite_api_externa: false,
    permite_offline: false,
    max_modulos: 10,
    max_api_keys: 0,
  };

  if (plan?.max_sucursales) {
    limits = {
      max_sucursales: plan.max_sucursales,
      max_habitaciones: plan.max_habitaciones,
      max_usuarios: plan.max_usuarios,
      max_roles: plan.max_roles,
      almacenamiento_gb: plan.almacenamiento_gb,
      permite_bd_exclusiva: plan.permite_bd_exclusiva,
      permite_dominio_propio: plan.permite_dominio_propio,
      permite_api_externa: plan.permite_api_externa,
      permite_offline: plan.permite_offline,
      max_modulos: plan.max_modulos,
      max_api_keys: plan.max_api_keys,
    };
  } else if (plan?.nombre === "PRO") {
    limits = {
      max_sucursales: 3,
      max_habitaciones: 80,
      max_usuarios: 25,
      max_roles: 15,
      almacenamiento_gb: 25,
      permite_bd_exclusiva: false,
      permite_dominio_propio: true,
      permite_api_externa: false,
      permite_offline: false,
      max_modulos: 20,
      max_api_keys: 0,
    };
  }

  if (plan?.nombre === "PREMIUM") {
    limits = {
      max_sucursales: 999,
      max_habitaciones: 9999,
      max_usuarios: 9999,
      max_roles: 9999,
      almacenamiento_gb: 100,
      permite_bd_exclusiva: true,
      permite_dominio_propio: true,
      permite_api_externa: true,
      permite_offline: true,
      max_modulos: 999,
      max_api_keys: 10,
    };
  }

  const columnsResult = await client.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'Empresa_limite'
    AND column_name = ANY($1);
    `,
    [["max_modulos", "max_api_keys"]]
  );
  const optionalColumns = new Set(columnsResult.rows.map((row) => row.column_name));
  const insertColumns = [
    "id_empresa",
    "max_sucursales",
    "max_habitaciones",
    "max_usuarios",
    "max_roles",
    "almacenamiento_gb",
    "permite_bd_exclusiva",
    "permite_dominio_propio",
    "permite_api_externa",
    "permite_offline",
  ];
  const values = [
    id_empresa,
    limits.max_sucursales,
    limits.max_habitaciones,
    limits.max_usuarios,
    limits.max_roles,
    limits.almacenamiento_gb,
    limits.permite_bd_exclusiva,
    limits.permite_dominio_propio,
    limits.permite_api_externa,
    limits.permite_offline,
  ];

  if (optionalColumns.has("max_modulos")) {
    insertColumns.push("max_modulos");
    values.push(limits.max_modulos);
  }

  if (optionalColumns.has("max_api_keys")) {
    insertColumns.push("max_api_keys");
    values.push(limits.max_api_keys);
  }

  const placeholders = values.map((_, index) => `$${index + 1}`).join(",");

  const result = await client.query(
    `
    INSERT INTO "Empresa_limite" (
      ${insertColumns.map((column) => `"${column}"`).join(", ")}
    )
    VALUES (${placeholders})
    RETURNING *;
    `,
    values
  );

  return result.rows[0];
};

export const activarModulosDelPlan = async (
  client,
  id_empresa,
  id_plan,
  modulosPersonalizados = []
) => {
  const selectedModules = [...new Set((modulosPersonalizados || []).map(Number))].filter(Boolean);
  const useCustomModules = selectedModules.length > 0;

  const result = await client.query(
    `
    INSERT INTO "Empresa_modulo" (
      id_empresa,
      id_modulo,
      activo,
      personalizado,
      beta,
      costo_extra
    )
    SELECT 
      $1,
      ${useCustomModules ? "m.id_modulo" : "pm.id_modulo"},
      true,
      $3,
      false,
      0
    FROM ${useCustomModules ? '"Modulo" m' : '"Plan_modulo" pm'}
    WHERE ${
      useCustomModules
        ? "m.id_modulo = ANY($2::bigint[]) AND m.activo = true AND m.deleted_at IS NULL"
        : "pm.id_plan = $2 AND pm.activo = true"
    }
    ON CONFLICT (id_empresa, id_modulo)
    DO UPDATE SET
      activo = true,
      personalizado = EXCLUDED.personalizado
    RETURNING *;
    `,
    [id_empresa, useCustomModules ? selectedModules : id_plan, useCustomModules]
  );

  const securityModulesResult = await client.query(
    `
    INSERT INTO "Empresa_modulo" (
      id_empresa,
      id_modulo,
      activo,
      personalizado,
      beta,
      costo_extra
    )
    SELECT
      $1,
      m.id_modulo,
      true,
      false,
      false,
      0
    FROM "Modulo" m
    WHERE m.clave IN ('usuarios', 'roles', 'permisos')
    AND m.activo = true
    ON CONFLICT (id_empresa, id_modulo)
    DO UPDATE SET activo = true
    RETURNING *;
    `,
    [id_empresa]
  );

  return [...result.rows, ...securityModulesResult.rows];
};

export const crearConfiguracionEmpresa = async (client, id_empresa) => {
  const result = await client.query(
    `
    INSERT INTO "Configuracion_empresa" (id_empresa)
    VALUES ($1)
    RETURNING *;
    `,
    [id_empresa]
  );

  return result.rows[0];
};

export const crearConfiguracionSucursal = async (client, id_empresa, id_sucursal) => {
  const result = await client.query(
    `
    INSERT INTO "Configuracion_sucursal" (
      id_empresa,
      id_sucursal
    )
    VALUES ($1, $2)
    RETURNING *;
    `,
    [id_empresa, id_sucursal]
  );

  return result.rows[0];
};

export const crearRolDueno = async (client, id_empresa) => {
  const result = await client.query(
    `
    INSERT INTO "Rol" (
      id_empresa,
      nombre,
      descripcion,
      es_sistema,
      estado
    )
    VALUES (
      $1,
      'DUEÑO',
      'Rol principal del dueño de la empresa.',
      true,
      'ACTIVO'
    )
    RETURNING *;
    `,
    [id_empresa]
  );

  return result.rows[0];
};

export const asignarPermisosRolDueno = async (client, id_rol) => {
  await client.query(
    `
    INSERT INTO "Rol_permiso" (id_rol, id_permiso)
    SELECT $1, id_permiso
    FROM "Permiso"
    WHERE activo = true
    ON CONFLICT (id_rol, id_permiso) DO NOTHING;
    `,
    [id_rol]
  );
};

export const crearUsuarioAdmin = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO "Usuario" (
      id_empresa,
      id_sucursal,
      nombres,
      apellidos,
      email,
      telefono,
      password_hash,
      tipo_usuario,
      estado
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,'DUEÑO','ACTIVO')
    RETURNING 
      id_usuario,
      uuid_usuario,
      id_empresa,
      id_sucursal,
      nombres,
      apellidos,
      email,
      telefono,
      tipo_usuario,
      estado;
    `,
    [
      data.id_empresa,
      data.id_sucursal,
      data.nombres,
      data.apellidos || null,
      data.email,
      data.telefono || null,
      data.password_hash,
    ]
  );

  return result.rows[0];
};

export const asignarRolUsuario = async (client, id_usuario, id_rol, id_empresa, id_sucursal) => {
  const result = await client.query(
    `
    INSERT INTO "Usuario_rol" (
      id_usuario,
      id_rol,
      id_empresa,
      id_sucursal,
      activo
    )
    VALUES ($1,$2,$3,$4,true)
    RETURNING *;
    `,
    [id_usuario, id_rol, id_empresa, id_sucursal]
  );

  return result.rows[0];
};

export const crearAreaDefault = async (client, id_empresa, id_sucursal) => {
  const result = await client.query(
    `
    INSERT INTO "Area" (
      id_empresa,
      id_sucursal,
      nombre,
      tipo_area,
      descripcion
    )
    VALUES (
      $1,
      $2,
      'Principal',
      'PERSONALIZADA',
      'Área principal creada automáticamente.'
    )
    RETURNING *;
    `,
    [id_empresa, id_sucursal]
  );

  return result.rows[0];
};

export const crearNivelDefault = async (client, id_empresa, id_sucursal, id_area) => {
  const result = await client.query(
    `
    INSERT INTO "Nivel" (
      id_empresa,
      id_sucursal,
      id_area,
      nombre,
      numero,
      descripcion
    )
    VALUES (
      $1,
      $2,
      $3,
      'Planta baja',
      1,
      'Nivel inicial creado automáticamente.'
    )
    RETURNING *;
    `,
    [id_empresa, id_sucursal, id_area]
  );

  return result.rows[0];
};
