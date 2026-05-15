import { z } from "zod";

const intLimit = z.coerce.number().int().nonnegative();
const numericLimit = z.coerce.number().nonnegative();

export const crearPlanSchema = z.object({
  nombre: z.string().min(2).max(80),
  descripcion: z.string().optional().nullable(),
  precio_base: z.coerce.number().nonnegative().default(0),
  tipo: z.string().min(2).max(40).default("BASE"),
  max_sucursales: intLimit.default(1),
  max_habitaciones: intLimit.default(20),
  max_usuarios: intLimit.default(5),
  max_roles: intLimit.default(3),
  max_modulos: intLimit.default(10),
  max_api_keys: intLimit.default(0),
  almacenamiento_gb: numericLimit.default(5),
  permite_bd_exclusiva: z.boolean().default(false),
  permite_dominio_propio: z.boolean().default(false),
  permite_api_externa: z.boolean().default(false),
  permite_offline: z.boolean().default(false),
  modulos: z.array(z.coerce.number().int().positive()).default([]),
});

export const actualizarPlanSchema = crearPlanSchema.partial();

export const cambiarEstadoPlanSchema = z.object({
  activo: z.boolean(),
});
