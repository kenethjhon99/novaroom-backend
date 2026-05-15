import { z } from "zod";

export const crearLicenciaSchema = z.object({
  id_empresa: z.number().int().positive(),
  id_plan: z.number().int().positive(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional().nullable(),
  estado: z.enum(["ACTIVA", "PRUEBA", "SUSPENDIDA", "VENCIDA", "CANCELADA"]).default("ACTIVA"),
  observaciones: z.string().optional().nullable(),
});

export const actualizarLicenciaSchema = crearLicenciaSchema
  .omit({ id_empresa: true })
  .partial();

export const cambiarEstadoLicenciaSchema = z.object({
  estado: z.enum(["ACTIVA", "PRUEBA", "SUSPENDIDA", "VENCIDA", "CANCELADA"]),
  observaciones: z.string().optional().nullable(),
});
