import { z } from "zod";

export const crearServicioHabitacionSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional().nullable(),
  icono: z.string().optional().nullable(),
});

export const actualizarServicioHabitacionSchema =
  crearServicioHabitacionSchema.partial();

export const asignarServiciosHabitacionSchema = z.object({
  servicios: z.array(z.number().int().positive()).min(1),
});