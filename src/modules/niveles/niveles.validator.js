import { z } from "zod";

export const crearNivelSchema = z.object({
  id_sucursal: z.number().int().positive(),
  id_area: z.number().int().positive().optional().nullable(),
  nombre: z.string().min(2),
  numero: z.number().int().optional().nullable(),
  descripcion: z.string().optional().nullable(),
});

export const actualizarNivelSchema = crearNivelSchema.partial();

export const cambiarEstadoNivelSchema = z.object({
  activo: z.boolean(),
});