import { z } from "zod";

const idSchema = z.coerce.number().int().positive();

export const crearUsuarioSchema = z.object({
  id_sucursal: idSchema.optional().nullable(),
  nombres: z.string().min(2),
  apellidos: z.string().optional().nullable(),
  email: z.string().email(),
  telefono: z.string().optional().nullable(),
  password: z.string().min(8),
  tipo_usuario: z.enum(["EMPRESA", "ADMIN_EMPRESA", "OPERADOR"]).default("EMPRESA"),
  roles: z.array(idSchema).min(1, "Selecciona al menos un rol"),
});

export const actualizarUsuarioSchema = z.object({
  id_sucursal: idSchema.optional().nullable(),
  nombres: z.string().min(2).optional(),
  apellidos: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  tipo_usuario: z.enum(["EMPRESA", "ADMIN_EMPRESA", "OPERADOR"]).optional(),
  roles: z.array(idSchema).min(1, "Selecciona al menos un rol").optional(),
});

export const cambiarEstadoUsuarioSchema = z.object({
  estado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO"]),
});

export const cambiarPasswordUsuarioSchema = z.object({
  password: z.string().min(8),
});
