import { z } from "zod";

export const crearTipoHabitacionSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional().nullable(),
  precio_base_hora: z.number().nonnegative().optional().default(0),
  precio_base_noche: z.number().nonnegative().optional().default(0),
  precio_tiempo_extra: z.number().nonnegative().optional().default(0),
});

export const actualizarTipoHabitacionSchema = crearTipoHabitacionSchema.partial();