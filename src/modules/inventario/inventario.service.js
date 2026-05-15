import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";

import {
  listarCategorias,
  crearCategoria,
  listarProductos,
  crearProducto,
  listarBodegas,
  crearBodega,
  listarInventario,
  obtenerInventarioItem,
  crearInventarioItem,
  actualizarInventarioItem,
  crearMovimientoInventario,
  validarBodegaSucursal,
  validarProductoEmpresa,
  validarSucursalEmpresa,
} from "./inventario.model.js";

export const listarCategoriasService = async (id_empresa) => {
  return listarCategorias(id_empresa);
};

export const crearCategoriaService = async (id_empresa, data) => {
  return crearCategoria(id_empresa, data);
};

export const listarProductosService = async (id_empresa) => {
  return listarProductos(id_empresa);
};

export const crearProductoService = async (id_empresa, data) => {
  return crearProducto(id_empresa, data);
};

export const listarBodegasService = async (id_empresa, id_sucursal) => {
  return listarBodegas(id_empresa, id_sucursal);
};

export const crearBodegaService = async (id_empresa, data) => {
  return withTransaction(async (client) => {
    const sucursalValida = await validarSucursalEmpresa(
      client,
      id_empresa,
      data.id_sucursal
    );

    if (!sucursalValida) {
      throw new AppError("Sucursal no valida para inventario", 400, null, "TENANT_BRANCH_FORBIDDEN");
    }

    return crearBodega(client, id_empresa, data);
  });
};

export const listarInventarioService = async (id_empresa, filters) => {
  return listarInventario(id_empresa, filters);
};

export const agregarStockService = async (id_empresa, data, user) => {
  return withTransaction(async (client) => {
    const [sucursalValida, bodegaValida, productoValido] = await Promise.all([
      validarSucursalEmpresa(client, id_empresa, data.id_sucursal),
      validarBodegaSucursal(client, id_empresa, data.id_sucursal, data.id_bodega),
      validarProductoEmpresa(client, id_empresa, data.id_producto),
    ]);

    if (!sucursalValida) {
      throw new AppError("Sucursal no valida para inventario", 400, null, "TENANT_BRANCH_FORBIDDEN");
    }

    if (!bodegaValida) {
      throw new AppError("La bodega no pertenece a esta sucursal", 400, null, "WAREHOUSE_INVALID");
    }

    if (!productoValido) {
      throw new AppError("Producto no valido para esta empresa", 400, null, "PRODUCT_INVALID");
    }

    const item = await obtenerInventarioItem(
      client,
      id_empresa,
      data.id_sucursal,
      data.id_bodega,
      data.id_producto
    );

    let existenciaAnterior = 0;
    let existenciaNueva = data.cantidad;
    let inventario;

    if (!item) {
      inventario = await crearInventarioItem(client, {
        id_empresa,
        id_sucursal: data.id_sucursal,
        id_bodega: data.id_bodega,
        id_producto: data.id_producto,
        existencia: data.cantidad,
        stock_minimo: data.stock_minimo || 0,
      });
    } else {
      existenciaAnterior = Number(item.existencia);
      existenciaNueva = existenciaAnterior + Number(data.cantidad);

      inventario = await actualizarInventarioItem(
        client,
        item.id_inventario,
        existenciaNueva,
        data.stock_minimo
      );
    }

    const movimiento = await crearMovimientoInventario(client, {
      id_empresa,
      id_sucursal: data.id_sucursal,
      id_bodega: data.id_bodega,
      id_producto: data.id_producto,
      tipo_movimiento: "AJUSTE_POSITIVO",
      cantidad: data.cantidad,
      existencia_anterior: existenciaAnterior,
      existencia_nueva: existenciaNueva,
      costo_unitario: data.costo_unitario || 0,
      motivo: data.motivo || "Ingreso manual de stock",
      registrado_por: user.id_usuario,
    });

    return {
      inventario,
      movimiento,
    };
  });
};
