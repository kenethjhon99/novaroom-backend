import { z } from "zod";

export const abrirCajaSchema = z.object({
  id_sucursal: z.number().int().positive(),
  monto_inicial: z.number().nonnegative().default(0),
  observaciones_apertura: z.string().optional().nullable(),
});

export const cerrarCajaSchema = z.object({
  monto_real: z.number().nonnegative(),
  observaciones_cierre: z.string().optional().nullable(),
});