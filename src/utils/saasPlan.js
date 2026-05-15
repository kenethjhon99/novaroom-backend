const securityModuleKeys = ["usuarios", "roles", "permisos"];

export const obtenerPlanComercial = async (client, id_plan) => {
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

export const aplicarPlanAEmpresa = async (client, id_empresa, id_plan) => {
  const plan = await obtenerPlanComercial(client, id_plan);

  if (!plan) {
    return null;
  }

  const limitesResult = await client.query(
    `
    INSERT INTO "Empresa_limite" (
      id_empresa,
      max_sucursales,
      max_habitaciones,
      max_usuarios,
      max_roles,
      almacenamiento_gb,
      permite_bd_exclusiva,
      permite_dominio_propio,
      permite_api_externa,
      permite_offline,
      max_modulos,
      max_api_keys
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (id_empresa)
    DO UPDATE SET
      max_sucursales = EXCLUDED.max_sucursales,
      max_habitaciones = EXCLUDED.max_habitaciones,
      max_usuarios = EXCLUDED.max_usuarios,
      max_roles = EXCLUDED.max_roles,
      almacenamiento_gb = EXCLUDED.almacenamiento_gb,
      permite_bd_exclusiva = EXCLUDED.permite_bd_exclusiva,
      permite_dominio_propio = EXCLUDED.permite_dominio_propio,
      permite_api_externa = EXCLUDED.permite_api_externa,
      permite_offline = EXCLUDED.permite_offline,
      max_modulos = EXCLUDED.max_modulos,
      max_api_keys = EXCLUDED.max_api_keys,
      updated_at = NOW()
    RETURNING *;
    `,
    [
      id_empresa,
      plan.max_sucursales,
      plan.max_habitaciones,
      plan.max_usuarios,
      plan.max_roles,
      plan.almacenamiento_gb,
      plan.permite_bd_exclusiva,
      plan.permite_dominio_propio,
      plan.permite_api_externa,
      plan.permite_offline,
      plan.max_modulos,
      plan.max_api_keys,
    ]
  );

  const modulosResult = await client.query(
    `
    SELECT id_modulo
    FROM "Plan_modulo"
    WHERE id_plan = $1
    AND activo = true;
    `,
    [id_plan]
  );
  const moduleIds = modulosResult.rows.map((row) => Number(row.id_modulo));

  if (moduleIds.length) {
    await client.query(
      `
      UPDATE "Empresa_modulo" em
      SET activo = false,
          updated_at = NOW()
      FROM "Modulo" m
      WHERE em.id_modulo = m.id_modulo
      AND em.id_empresa = $1
      AND em.personalizado = false
      AND m.clave <> ALL($2::text[])
      AND em.id_modulo <> ALL($3::bigint[]);
      `,
      [id_empresa, securityModuleKeys, moduleIds]
    );
  }

  await client.query(
    `
    INSERT INTO "Empresa_modulo" (
      id_empresa,
      id_modulo,
      activo,
      personalizado,
      beta,
      costo_extra
    )
    SELECT $1, pm.id_modulo, true, false, false, 0
    FROM "Plan_modulo" pm
    WHERE pm.id_plan = $2
    AND pm.activo = true
    ON CONFLICT (id_empresa, id_modulo)
    DO UPDATE SET
      activo = true,
      personalizado = false,
      updated_at = NOW();
    `,
    [id_empresa, id_plan]
  );

  await client.query(
    `
    INSERT INTO "Empresa_modulo" (
      id_empresa,
      id_modulo,
      activo,
      personalizado,
      beta,
      costo_extra
    )
    SELECT $1, m.id_modulo, true, false, false, 0
    FROM "Modulo" m
    WHERE m.clave = ANY($2::text[])
    AND m.activo = true
    ON CONFLICT (id_empresa, id_modulo)
    DO UPDATE SET activo = true, updated_at = NOW();
    `,
    [id_empresa, securityModuleKeys]
  );

  return {
    plan,
    limites: limitesResult.rows[0],
    modulos_activados: moduleIds.length,
  };
};
