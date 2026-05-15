import { query } from "../../config/db.js";

export const listarNiveles = async (id_empresa, filters = {}) => {
  const params = [id_empresa];
  let conditions = `
    WHERE n.id_empresa = $1
    AND n.deleted_at IS NULL
  `;

  if (filters.id_sucursal) {
    params.push(filters.id_sucursal);
    conditions += ` AND n.id_sucursal = $${params.length}`;
  }

  if (filters.id_area) {
    params.push(filters.id_area);
    conditions += ` AND n.id_area = $${params.length}`;
  }

  const result = await query(
    `
    SELECT 
      n.*,
      s.nombre AS sucursal,
      a.nombre AS area,
      a.tipo_area
    FROM "Nivel" n
    INNER JOIN "Sucursal" s ON s.id_sucursal = n.id_sucursal
    LEFT JOIN "Area" a ON a.id_area = n.id_area
    ${conditions}
    ORDER BY n.numero ASC NULLS LAST, n.created_at ASC;
    `,
    params
  );

  return result.rows;
};

export const obtenerNivelPorUuid = async (uuid_nivel, id_empresa) => {
  const result = await query(
    `
    SELECT 
      n.*,
      s.nombre AS sucursal,
      a.nombre AS area,
      a.tipo_area
    FROM "Nivel" n
    INNER JOIN "Sucursal" s ON s.id_sucursal = n.id_sucursal
    LEFT JOIN "Area" a ON a.id_area = n.id_area
    WHERE n.uuid_nivel = $1
    AND n.id_empresa = $2
    AND n.deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_nivel, id_empresa]
  );

  return result.rows[0] || null;
};

export const validarSucursalEmpresa = async (id_sucursal, id_empresa) => {
  const result = await query(
    `
    SELECT id_sucursal
    FROM "Sucursal"
    WHERE id_sucursal = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_sucursal, id_empresa]
  );

  return !!result.rows[0];
};

export const validarAreaEmpresa = async (id_area, id_empresa, id_sucursal) => {
  const result = await query(
    `
    SELECT id_area
    FROM "Area"
    WHERE id_area = $1
    AND id_empresa = $2
    AND id_sucursal = $3
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_area, id_empresa, id_sucursal]
  );

  return !!result.rows[0];
};

export const crearNivel = async (id_empresa, data) => {
  const result = await query(
    `
    INSERT INTO "Nivel" (
      id_empresa,
      id_sucursal,
      id_area,
      nombre,
      numero,
      descripcion,
      activo
    )
    VALUES ($1,$2,$3,$4,$5,$6,true)
    RETURNING *;
    `,
    [
      id_empresa,
      data.id_sucursal,
      data.id_area || null,
      data.nombre,
      data.numero || null,
      data.descripcion || null,
    ]
  );

  return result.rows[0];
};

export const actualizarNivel = async (uuid_nivel, id_empresa, data) => {
  const result = await query(
    `
    UPDATE "Nivel"
    SET
      id_sucursal = COALESCE($1, id_sucursal),
      id_area = COALESCE($2, id_area),
      nombre = COALESCE($3, nombre),
      numero = COALESCE($4, numero),
      descripcion = COALESCE($5, descripcion),
      updated_at = NOW()
    WHERE uuid_nivel = $6
    AND id_empresa = $7
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [
      data.id_sucursal ?? null,
      data.id_area ?? null,
      data.nombre ?? null,
      data.numero ?? null,
      data.descripcion ?? null,
      uuid_nivel,
      id_empresa,
    ]
  );

  return result.rows[0] || null;
};

export const cambiarEstadoNivel = async (uuid_nivel, id_empresa, activo) => {
  const result = await query(
    `
    UPDATE "Nivel"
    SET activo = $1,
        updated_at = NOW()
    WHERE uuid_nivel = $2
    AND id_empresa = $3
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [activo, uuid_nivel, id_empresa]
  );

  return result.rows[0] || null;
};

export const eliminarNivel = async (uuid_nivel, id_empresa) => {
  const result = await query(
    `
    UPDATE "Nivel"
    SET deleted_at = NOW(),
        activo = false,
        updated_at = NOW()
    WHERE uuid_nivel = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    RETURNING *;
    `,
    [uuid_nivel, id_empresa]
  );

  return result.rows[0] || null;
};