import { z } from "zod";

export const crearSuscripcionSchema = z.object({
  id_empresa: z.number().int().positive(),
  id_plan: z.number().int().positive(),
  id_licencia: z.number().int().positive().optional().nullable(),
  estado: z.enum(["ACTIVA", "PRUEBA", "PAUSADA", "VENCIDA", "CANCELADA"]).default("ACTIVA"),
  ciclo: z.enum(["MENSUAL", "ANUAL", "PERSONALIZADO"]).default("MENSUAL"),
  monto: z.number().nonnegative().default(0),
  moneda: z.string().min(3).max(10).default("GTQ"),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional().nullable(),
  proximo_cobro: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

export const actualizarSuscripcionSchema = crearSuscripcionSchema
  .omit({ id_empresa: true })
  .partial();

export const cambiarEstadoSuscripcionSchema = z.object({
  estado: z.enum(["ACTIVA", "PRUEBA", "PAUSADA", "VENCIDA", "CANCELADA"]),
  observaciones: z.string().optional().nullable(),
});
