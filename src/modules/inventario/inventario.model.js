import { query } from "../../config/db.js";

export const listarCategorias = async (id_empresa) => {
  const result = await query(
    `
    SELECT *
    FROM "Categoria_producto"
    WHERE id_empresa = $1
    AND deleted_at IS NULL
    ORDER BY nombre ASC;
    `,
    [id_empresa]
  );

  return result.rows;
};

export const crearCategoria = async (id_empresa, data) => {
  const result = await query(
    `
    INSERT INTO "Categoria_producto" (
      id_empresa,
      nombre,
      descripcion
    )
    VALUES ($1,$2,$3)
    RETURNING *;
    `,
    [id_empresa, data.nombre, data.descripcion || null]
  );

  return result.rows[0];
};

export const listarProductos = async (id_empresa) => {
  const result = await query(
    `
    SELECT
      p.*,
      c.nombre AS categoria
    FROM "Producto" p
    LEFT JOIN "Categoria_producto" c 
      ON c.id_categoria_producto = p.id_categoria_producto
    WHERE p.id_empresa = $1
    AND p.deleted_at IS NULL
    ORDER BY p.nombre ASC;
    `,
    [id_empresa]
  );

  return result.rows;
};

export const crearProducto = async (id_empresa, data) => {
  const result = await query(
    `
    INSERT INTO "Producto" (
      id_empresa,
      id_categoria_producto,
      codigo_barras,
      nombre,
      descripcion,
      tipo_producto,
      precio_compra,
      precio_venta,
      unidad_medida,
      requiere_stock,
      es_consumo_interno,
      es_extra_habitacion
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *;
    `,
    [
      id_empresa,
      data.id_categoria_producto || null,
      data.codigo_barras || null,
      data.nombre,
      data.descripcion || null,
      data.tipo_producto,
      data.precio_compra || 0,
      data.precio_venta || 0,
      data.unidad_medida || "UNIDAD",
      data.requiere_stock ?? true,
      data.es_consumo_interno ?? false,
      data.es_extra_habitacion ?? false,
    ]
  );

  return result.rows[0];
};

export const listarBodegas = async (id_empresa, id_sucursal = null) => {
  const params = [id_empresa];
  let filter = "";

  if (id_sucursal) {
    params.push(id_sucursal);
    filter = `AND b.id_sucursal = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      b.*,
      s.nombre AS sucursal
    FROM "Bodega" b
    INNER JOIN "Sucursal" s ON s.id_sucursal = b.id_sucursal
    WHERE b.id_empresa = $1
    ${filter}
    AND b.deleted_at IS NULL
    ORDER BY b.nombre ASC;
    `,
    params
  );

  return result.rows;
};

export const crearBodega = async (db, id_empresa, data) => {
  const result = await db.query(
    `
    INSERT INTO "Bodega" (
      id_empresa,
      id_sucursal,
      nombre,
      descripcion,
      tipo_bodega
    )
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *;
    `,
    [
      id_empresa,
      data.id_sucursal,
      data.nombre,
      data.descripcion || null,
      data.tipo_bodega || "GENERAL",
    ]
  );

  return result.rows[0];
};

export const validarSucursalEmpresa = async (client, id_empresa, id_sucursal) => {
  const result = await client.query(
    `
    SELECT id_sucursal
    FROM "Sucursal"
    WHERE id_empresa = $1
    AND id_sucursal = $2
    AND estado = 'ACTIVA'
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_empresa, id_sucursal]
  );

  return !!result.rows[0];
};

export const validarBodegaSucursal = async (
  client,
  id_empresa,
  id_sucursal,
  id_bodega
) => {
  const result = await client.query(
    `
    SELECT id_bodega
    FROM "Bodega"
    WHERE id_empresa = $1
    AND id_sucursal = $2
    AND id_bodega = $3
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_empresa, id_sucursal, id_bodega]
  );

  return !!result.rows[0];
};

export const validarProductoEmpresa = async (client, id_empresa, id_producto) => {
  const result = await client.query(
    `
    SELECT id_producto
    FROM "Producto"
    WHERE id_empresa = $1
    AND id_producto = $2
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [id_empresa, id_producto]
  );

  return !!result.rows[0];
};

export const listarInventario = async (id_empresa, filters = {}) => {
  const params = [id_empresa];

  let conditions = `
    WHERE i.id_empresa = $1
  `;

  if (filters.id_sucursal) {
    params.push(filters.id_sucursal);
    conditions += ` AND i.id_sucursal = $${params.length}`;
  }

  if (filters.id_bodega) {
    params.push(filters.id_bodega);
    conditions += ` AND i.id_bodega = $${params.length}`;
  }

  const result = await query(
    `
    SELECT
      i.*,
      p.nombre AS producto,
      p.tipo_producto,
      p.precio_venta,
      p.unidad_medida,
      b.nombre AS bodega,
      s.nombre AS sucursal
    FROM "Inventario" i
    INNER JOIN "Producto" p ON p.id_producto = i.id_producto
    INNER JOIN "Bodega" b ON b.id_bodega = i.id_bodega
    INNER JOIN "Sucursal" s ON s.id_sucursal = i.id_sucursal
    ${conditions}
    ORDER BY p.nombre ASC;
    `,
    params
  );

  return result.rows;
};

export const obtenerInventarioItem = async (
  client,
  id_empresa,
  id_sucursal,
  id_bodega,
  id_producto
) => {
  const result = await client.query(
    `
    SELECT *
    FROM "Inventario"
    WHERE id_empresa = $1
    AND id_sucursal = $2
    AND id_bodega = $3
    AND id_producto = $4
    LIMIT 1;
    `,
    [id_empresa, id_sucursal, id_bodega, id_producto]
  );

  return result.rows[0] || null;
};

export const crearInventarioItem = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO "Inventario" (
      id_empresa,
      id_sucursal,
      id_bodega,
      id_producto,
      existencia,
      stock_minimo
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.id_sucursal,
      data.id_bodega,
      data.id_producto,
      data.existencia,
      data.stock_minimo || 0,
    ]
  );

  return result.rows[0];
};

export const actualizarInventarioItem = async (
  client,
  id_inventario,
  nuevaExistencia,
  stockMinimo = null
) => {
  const result = await client.query(
    `
    UPDATE "Inventario"
    SET existencia = $1,
        stock_minimo = COALESCE($2, stock_minimo),
        updated_at = NOW()
    WHERE id_inventario = $3
    RETURNING *;
    `,
    [nuevaExistencia, stockMinimo, id_inventario]
  );

  return result.rows[0];
};

export const crearMovimientoInventario = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO "Movimiento_inventario" (
      id_empresa,
      id_sucursal,
      id_bodega,
      id_producto,
      tipo_movimiento,
      cantidad,
      existencia_anterior,
      existencia_nueva,
      costo_unitario,
      referencia_tipo,
      referencia_id,
      motivo,
      registrado_por
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.id_sucursal,
      data.id_bodega,
      data.id_producto,
      data.tipo_movimiento,
      data.cantidad,
      data.existencia_anterior,
      data.existencia_nueva,
      data.costo_unitario || 0,
      data.referencia_tipo || null,
      data.referencia_id || null,
      data.motivo || null,
      data.registrado_por || null,
    ]
  );

  return result.rows[0];
};
