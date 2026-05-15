import { z } from "zod";

const idSchema = z.coerce.number().int().positive();

export const crearRolSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional().nullable(),
  permisos: z.array(idSchema).min(1, "Selecciona al menos un permiso"),
});

export const actualizarRolSchema = z.object({
  nombre: z.string().min(2).optional(),
  descripcion: z.string().optional().nullable(),
  permisos: z.array(idSchema).min(1, "Selecciona al menos un permiso").optional(),
});

export const cambiarEstadoRolSchema = z.object({
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});
