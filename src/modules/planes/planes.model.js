import { query } from "../../config/db.js";

export const listarPlanes = async () => {
  const result = await query(`
    SELECT
      p.*,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id_modulo', m.id_modulo,
            'clave', m.clave,
            'nombre', m.nombre
          )
        ) FILTER (WHERE m.id_modulo IS NOT NULL),
        '[]'
      ) AS modulos
    FROM "Plan" p
    LEFT JOIN "Plan_modulo" pm ON pm.id_plan = p.id_plan AND pm.activo = true
    LEFT JOIN "Modulo" m ON m.id_modulo = pm.id_modulo AND m.deleted_at IS NULL
    WHERE p.deleted_at IS NULL
    GROUP BY p.id_plan
    ORDER BY p.precio_base ASC, p.nombre ASC;
  `);

  return result.rows;
};

export const obtenerPlanPorUuid = async (uuid_plan) => {
  const result = await query(
    `
    SELECT *
    FROM "Plan"
    WHERE uuid_plan = $1
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_plan]
  );

  return result.rows[0] || null;
};

const planLimitFields = [
  "max_sucursales",
  "max_habitaciones",
  "max_usuarios",
  "max_roles",
  "max_modulos",
  "max_api_keys",
  "almacenamiento_gb",
  "permite_bd_exclusiva",
  "permite_dominio_propio",
  "permite_api_externa",
  "permite_offline",
];

export const crearPlan = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO "Plan" (
      nombre,
      descripcion,
      precio_base,
      tipo,
      activo,
      max_sucursales,
      max_habitaciones,
      max_usuarios,
      max_roles,
      max_modulos,
      max_api_keys,
      almacenamiento_gb,
      permite_bd_exclusiva,
      permite_dominio_propio,
      permite_api_externa,
      permite_offline
    )
    VALUES ($1,$2,$3,$4,true,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING *;
    `,
    [
      data.nombre,
      data.descripcion || null,
      data.precio_base ?? 0,
      data.tipo || "BASE",
      data.max_sucursales ?? 1,
      data.max_habitaciones ?? 20,
      data.max_usuarios ?? 5,
      data.max_roles ?? 3,
      data.max_modulos ?? 10,
      data.max_api_keys ?? 0,
      data.almacenamiento_gb ?? 5,
      data.permite_bd_exclusiva ?? false,
      data.permite_dominio_propio ?? false,
      data.permite_api_externa ?? false,
      data.permite_offline ?? false,
    ]
  );

  return result.rows[0];
};

export const actualizarPlan = async (client, uuid_plan, data) => {
  const result = await client.query(
    `
    UPDATE "Plan"
    SET nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        precio_base = COALESCE($3, precio_base),
        tipo = COALESCE($4, tipo),
        max_sucursales = COALESCE($5, max_sucursales),
        max_habitaciones = COALESCE($6, max_habitaciones),
        max_usuarios = COALESCE($7, max_usuarios),
        max_roles = COALESCE($8, max_roles),
        max_modulos = COALESCE($9, max_modulos),
        max_api_keys = COALESCE($10, max_api_keys),
        almacenamiento_gb = COALESCE($11, almacenamiento_gb),
        permite_bd_exclusiva = COALESCE($12, permite_bd_exclusiva),
        permite_dominio_propio = COALESCE($13, permite_dominio_propio),
        permite_api_externa = COALESCE($14, permite_api_externa),
        permite_offline = COALESCE($15, permite_offline),
        updated_at = NOW()
    WHERE uuid_plan = $16
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [
      data.nombre ?? null,
      data.descripcion ?? null,
      data.precio_base ?? null,
      data.tipo ?? null,
      ...planLimitFields.map((field) => data[field] ?? null),
      uuid_plan,
    ]
  );

  return result.rows[0] || null;
};

export const cambiarEstadoPlan = async (uuid_plan, activo) => {
  const result = await query(
    `
    UPDATE "Plan"
    SET activo = $1,
        updated_at = NOW()
    WHERE uuid_plan = $2
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [activo, uuid_plan]
  );

  return result.rows[0] || null;
};

export const validarModulos = async (client, modulos) => {
  if (!modulos?.length) return true;

  const result = await client.query(
    `
    SELECT COUNT(*)::int AS total
    FROM "Modulo"
    WHERE id_modulo = ANY($1::bigint[])
    AND activo = true
    AND deleted_at IS NULL;
    `,
    [modulos]
  );

  return result.rows[0].total === modulos.length;
};

export const reemplazarModulosPlan = async (client, id_plan, modulos = []) => {
  await client.query(`UPDATE "Plan_modulo" SET activo = false WHERE id_plan = $1;`, [
    id_plan,
  ]);

  for (const id_modulo of modulos) {
    await client.query(
      `
      INSERT INTO "Plan_modulo" (id_plan, id_modulo, activo)
      VALUES ($1,$2,true)
      ON CONFLICT (id_plan, id_modulo)
      DO UPDATE SET activo = true;
      `,
      [id_plan, id_modulo]
    );
  }
};
