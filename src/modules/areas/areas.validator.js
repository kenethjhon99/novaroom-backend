import { z } from "zod";

export const crearAreaSchema = z.object({
  id_sucursal: z.number().int().positive(),
  nombre: z.string().min(2),
  tipo_area: z.enum([
    "AUTO_HOTEL",
    "HOTEL",
    "VIP",
    "SUITE",
    "FAMILIAR",
    "ECONOMICA",
    "PERSONALIZADA",
  ]).default("PERSONALIZADA"),
  descripcion: z.string().optional().nullable(),
  configuracion_json: z.record(z.any()).optional(),
});

export const actualizarAreaSchema = crearAreaSchema.partial();

export const cambiarEstadoAreaSchema = z.object({
  activo: z.boolean(),
});