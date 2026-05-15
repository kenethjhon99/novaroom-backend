import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { emitToEmpresa, emitToSucursal } from "../../config/socket.js";

import {
  obtenerOcupacionActiva,
  obtenerProducto,
  obtenerInventario,
  crearVentaExtra,
  crearDetalleVentaExtra,
  actualizarInventario,
  crearMovimientoInventario,
  actualizarMontoExtrasOcupacion,
  listarExtrasPorOcupacion,
} from "./extras.model.js";

export const venderExtraService = async (id_empresa, data, user) => {
  return withTransaction(async (client) => {
    const ocupacion = await obtenerOcupacionActiva(
      client,
      data.uuid_ocupacion,
      id_empresa
    );

    if (!ocupacion) {
      throw new AppError("Ocupación activa no encontrada", 404);
    }

    let total = 0;
    const detallesPreparados = [];

    for (const item of data.items) {
      const producto = await obtenerProducto(
        client,
        id_empresa,
        item.id_producto
      );

      if (!producto) {
        throw new AppError(`Producto ${item.id_producto} no encontrado`, 404);
      }

      const inventario = await obtenerInventario(
        client,
        id_empresa,
        ocupacion.id_sucursal,
        data.id_bodega,
        item.id_producto
      );

      if (producto.requiere_stock && !inventario) {
        throw new AppError(`No hay inventario para ${producto.nombre}`, 400);
      }

      if (
        producto.requiere_stock &&
        Number(inventario.existencia) < Number(item.cantidad)
      ) {
        throw new AppError(
          `Stock insuficiente para ${producto.nombre}. Disponible: ${inventario.existencia}`,
          400
        );
      }

      const subtotal = Number(producto.precio_venta) * Number(item.cantidad);
      total += subtotal;

      detallesPreparados.push({
        producto,
        inventario,
        cantidad: Number(item.cantidad),
        precio_unitario: Number(producto.precio_venta),
        subtotal,
      });
    }

    const ventaExtra = await crearVentaExtra(client, {
      id_empresa,
      id_sucursal: ocupacion.id_sucursal,
      id_ocupacion: ocupacion.id_ocupacion,
      id_habitacion: ocupacion.id_habitacion,
      total,
      vendido_por: user.id_usuario,
    });

    for (const detalle of detallesPreparados) {
      await crearDetalleVentaExtra(client, {
        id_empresa,
        id_venta_extra: ventaExtra.id_venta_extra,
        id_producto: detalle.producto.id_producto,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        subtotal: detalle.subtotal,
      });

      if (detalle.producto.requiere_stock) {
        const existenciaAnterior = Number(detalle.inventario.existencia);
        const existenciaNueva = existenciaAnterior - detalle.cantidad;

        await actualizarInventario(
          client,
          detalle.inventario.id_inventario,
          existenciaNueva
        );

        await crearMovimientoInventario(client, {
          id_empresa,
          id_sucursal: ocupacion.id_sucursal,
          id_bodega: data.id_bodega,
          id_producto: detalle.producto.id_producto,
          tipo_movimiento: "SALIDA_VENTA",
          cantidad: detalle.cantidad,
          existencia_anterior: existenciaAnterior,
          existencia_nueva: existenciaNueva,
          costo_unitario: detalle.producto.precio_compra || 0,
          referencia_tipo: "VENTA_EXTRA",
          referencia_id: ventaExtra.id_venta_extra,
          motivo: "Venta de extra a habitación",
          registrado_por: user.id_usuario,
        });
      }
    }

    const ocupacionActualizada = await actualizarMontoExtrasOcupacion(
      client,
      ocupacion.id_ocupacion,
      total
    );

    emitToEmpresa(id_empresa, "inventario:actualizado", {
  id_empresa,
  id_sucursal: ocupacion.id_sucursal,
  accion: "EXTRA_VENDIDO",
});

emitToSucursal(ocupacion.id_sucursal, "dashboard:actualizado", {
  accion: "EXTRA_VENDIDO",
});

emitToSucursal(ocupacion.id_sucursal, "habitacion:actualizada", {
  accion: "EXTRA_VENDIDO",
});

    return {
      venta_extra: ventaExtra,
      total,
      ocupacion: ocupacionActualizada,
    };
  });
};

export const listarExtrasOcupacionService = async (id_empresa, uuid_ocupacion) => {
  return withTransaction(async (client) => {
    const ocupacion = await obtenerOcupacionActiva(
      client,
      uuid_ocupacion,
      id_empresa
    );

    if (!ocupacion) {
      throw new AppError("Ocupación activa no encontrada", 404);
    }

    return listarExtrasPorOcupacion(client, id_empresa, ocupacion.id_ocupacion);
  });
};