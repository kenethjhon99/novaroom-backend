import { z } from "zod";

export const crearSucursalSchema = z.object({
  nombre: z.string().min(2),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  coordenadas: z.string().optional().nullable(),
});

export const actualizarSucursalSchema = crearSucursalSchema.partial();

export const cambiarEstadoSucursalSchema = z.object({
  estado: z.enum(["ACTIVA", "INACTIVA", "SUSPENDIDA"]),
});