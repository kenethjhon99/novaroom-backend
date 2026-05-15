export const obtenerOcupacionActiva = async (client, uuid_ocupacion, id_empresa) => {
  const result = await client.query(
    `
    SELECT *
    FROM "Ocupacion"
    WHERE uuid_ocupacion = $1
    AND id_empresa = $2
    AND estado = 'ACTIVA'
    AND deleted_at IS NULL
    LIMIT 1;
    `,
    [uuid_ocupacion, id_empresa]
  );

  return result.rows[0] || null;
};

export const obtenerProducto = async (client, id_empresa, id_producto) => {
  const result = await client.query(
    `
    SELECT *
    FROM "Producto"
    WHERE id_producto = $1
    AND id_empresa = $2
    AND deleted_at IS NULL
    AND estado = 'ACTIVO'
    LIMIT 1;
    `,
    [id_producto, id_empresa]
  );

  return result.rows[0] || null;
};

export const obtenerInventario = async (
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

export const crearVentaExtra = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO "Venta_extra" (
      id_empresa,
      id_sucursal,
      id_ocupacion,
      id_habitacion,
      estado,
      subtotal,
      descuento,
      total,
      vendido_por
    )
    VALUES ($1,$2,$3,$4,'CONFIRMADA',$5,0,$5,$6)
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.id_sucursal,
      data.id_ocupacion,
      data.id_habitacion,
      data.total,
      data.vendido_por,
    ]
  );

  return result.rows[0];
};

export const crearDetalleVentaExtra = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO "Detalle_venta_extra" (
      id_empresa,
      id_venta_extra,
      id_producto,
      cantidad,
      precio_unitario,
      subtotal
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
    `,
    [
      data.id_empresa,
      data.id_venta_extra,
      data.id_producto,
      data.cantidad,
      data.precio_unitario,
      data.subtotal,
    ]
  );

  return result.rows[0];
};

export const actualizarInventario = async (
  client,
  id_inventario,
  nuevaExistencia
) => {
  const result = await client.query(
    `
    UPDATE "Inventario"
    SET existencia = $1,
        updated_at = NOW()
    WHERE id_inventario = $2
    RETURNING *;
    `,
    [nuevaExistencia, id_inventario]
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
      data.costo_unitario,
      data.referencia_tipo,
      data.referencia_id,
      data.motivo,
      data.registrado_por,
    ]
  );

  return result.rows[0];
};

export const actualizarMontoExtrasOcupacion = async (
  client,
  id_ocupacion,
  totalExtra
) => {
  const result = await client.query(
    `
    UPDATE "Ocupacion"
    SET monto_extras = monto_extras + $1,
        monto_total = monto_total + $1,
        updated_at = NOW()
    WHERE id_ocupacion = $2
    RETURNING *;
    `,
    [totalExtra, id_ocupacion]
  );

  return result.rows[0];
};

export const listarExtrasPorOcupacion = async (client, id_empresa, id_ocupacion) => {
  const result = await client.query(
    `
    SELECT 
      ve.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id_producto', p.id_producto,
            'producto', p.nombre,
            'cantidad', dve.cantidad,
            'precio_unitario', dve.precio_unitario,
            'subtotal', dve.subtotal
          )
        ) FILTER (WHERE dve.id_detalle_venta_extra IS NOT NULL),
        '[]'
      ) AS items
    FROM "Venta_extra" ve
    LEFT JOIN "Detalle_venta_extra" dve 
      ON dve.id_venta_extra = ve.id_venta_extra
    LEFT JOIN "Producto" p 
      ON p.id_producto = dve.id_producto
    WHERE ve.id_empresa = $1
    AND ve.id_ocupacion = $2
    AND ve.deleted_at IS NULL
    GROUP BY ve.id_venta_extra
    ORDER BY ve.created_at DESC;
    `,
    [id_empresa, id_ocupacion]
  );

  return result.rows;
};