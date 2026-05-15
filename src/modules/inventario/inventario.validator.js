import { z } from "zod";

const idSchema = z.coerce.number().int().positive();
const moneySchema = z.coerce.number().nonnegative();

export const crearCategoriaSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional().nullable(),
});

export const crearProductoSchema = z.object({
  id_categoria_producto: idSchema.optional().nullable(),
  codigo_barras: z.string().optional().nullable(),
  nombre: z.string().min(2),
  descripcion: z.string().optional().nullable(),

  tipo_producto: z.enum([
    "VENTA",
    "LIMPIEZA",
    "LAVANDERIA",
    "MANTENIMIENTO",
    "CORTESIA",
    "SERVICIO",
  ]).default("VENTA"),

  precio_compra: moneySchema.optional().default(0),
  precio_venta: moneySchema.optional().default(0),

  unidad_medida: z.string().optional().default("UNIDAD"),

  requiere_stock: z.boolean().optional().default(true),
  es_consumo_interno: z.boolean().optional().default(false),
  es_extra_habitacion: z.boolean().optional().default(false),
});

export const crearBodegaSchema = z.object({
  id_sucursal: idSchema,
  nombre: z.string().min(2),
  descripcion: z.string().optional().nullable(),
  tipo_bodega: z.enum([
    "GENERAL",
    "RECEPCION",
    "LIMPIEZA",
    "LAVANDERIA",
    "MANTENIMIENTO",
  ]).default("GENERAL"),
});

export const agregarStockSchema = z.object({
  id_sucursal: idSchema,
  id_bodega: idSchema,
  id_producto: idSchema,
  cantidad: z.coerce.number().positive(),
  stock_minimo: moneySchema.optional().default(0),
  costo_unitario: moneySchema.optional().default(0),
  motivo: z.string().optional().nullable(),
});
