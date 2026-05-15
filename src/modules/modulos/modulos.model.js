import { query } from "../../config/db.js";

export const listarModulos = async () => {
  const result = await query(
    `
    SELECT *
    FROM "Modulo"
    WHERE deleted_at IS NULL
    ORDER BY nombre ASC;
    `
  );

  return result.rows;
};

export const listarModulosEmpresa = async (id_empresa) => {
  const result = await query(
    `
    SELECT
      m.id_modulo,
      m.uuid_modulo,
      m.nombre,
      m.clave,
      m.descripcion,
      m.es_premium,
      m.activo AS modulo_activo,
      COALESCE(em.activo, false) AS activo,
      COALESCE(em.personalizado, false) AS personalizado,
      COALESCE(em.beta, false) AS beta,
      COALESCE(em.costo_extra, 0) AS costo_extra,
      em.fecha_activacion,
      em.fecha_desactivacion
    FROM "Modulo" m
    LEFT JOIN "Empresa_modulo" em
      ON em.id_modulo = m.id_modulo
      AND em.id_empresa = $1
    WHERE m.deleted_at IS NULL
    ORDER BY m.nombre ASC;
    `,
    [id_empresa]
  );

  return result.rows;
};

export const obtenerModuloEmpresa = async (id_empresa, id_modulo) => {
  const result = await query(
    `
    SELECT
      m.id_modulo,
      m.activo AS modulo_activo,
      COALESCE(em.activo, false) AS activo
    FROM "Modulo" m
    LEFT JOIN "Empresa_modulo" em
      ON em.id_modulo = m.id_modulo
      AND em.id_empresa = $1
    WHERE m.id_modulo = $2
    AND m.deleted_at IS NULL
    LIMIT 1;
    `,
    [id_empresa, id_modulo]
  );

  return result.rows[0] || null;
};

export const actualizarModuloEmpresa = async (id_empresa, id_modulo, data) => {
  const result = await query(
    `
    INSERT INTO "Empresa_modulo" (
      id_empresa,
      id_modulo,
      activo,
      personalizado,
      beta,
      costo_extra,
      fecha_activacion,
      fecha_desactivacion
    )
    VALUES ($1,$2,$3,$4,$5,$6,NOW(),CASE WHEN $3 = false THEN NOW() ELSE NULL END)
    ON CONFLICT (id_empresa, id_modulo)
    DO UPDATE SET
      activo = EXCLUDED.activo,
      personalizado = EXCLUDED.personalizado,
      beta = EXCLUDED.beta,
      costo_extra = EXCLUDED.costo_extra,
      fecha_activacion = CASE
        WHEN EXCLUDED.activo = true THEN NOW()
        ELSE "Empresa_modulo".fecha_activacion
      END,
      fecha_desactivacion = CASE
        WHEN EXCLUDED.activo = false THEN NOW()
        ELSE NULL
      END
    RETURNING *;
    `,
    [
      id_empresa,
      id_modulo,
      data.activo,
      data.personalizado ?? false,
      data.beta ?? false,
      data.costo_extra ?? 0,
    ]
  );

  return result.rows[0];
};
