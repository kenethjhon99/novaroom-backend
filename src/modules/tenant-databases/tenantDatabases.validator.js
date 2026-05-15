import { z } from "zod";

const estadoSchema = z.enum([
  "PENDIENTE",
  "PROVISIONANDO",
  "LISTA",
  "MIGRANDO",
  "ACTIVA",
  "SUSPENDIDA",
  "ERROR",
]);

const migracionSchema = z.enum([
  "NO_INICIADA",
  "PENDIENTE",
  "EN_PROCESO",
  "COMPLETADA",
  "ERROR",
]);

export const crearTenantDatabaseSchema = z.object({
  id_empresa: z.number().int().positive(),
  tipo: z.enum(["COMPARTIDA", "DEDICADA"]).default("DEDICADA"),
  proveedor: z.enum(["NEON", "POSTGRES", "RENDER", "MANUAL"]).default("NEON"),
  estado: estadoSchema.default("PENDIENTE"),
  connection_ref: z.string().max(500).optional().nullable(),
  database_name: z.string().max(160).optional().nullable(),
  region: z.string().max(80).optional().nullable(),
  ssl_required: z.boolean().default(true),
  migracion_estado: migracionSchema.default("NO_INICIADA"),
  migracion_version: z.string().max(80).optional().nullable(),
  notas: z.string().optional().nullable(),
});

export const actualizarTenantDatabaseSchema = crearTenantDatabaseSchema
  .omit({ id_empresa: true, tipo: true })
  .partial()
  .extend({
    ultimo_backup_at: z.string().optional().nullable(),
    health_status: z.enum(["DESCONOCIDO", "OK", "ERROR"]).optional(),
  });

export const registrarHealthTenantDatabaseSchema = z.object({
  health_status: z.enum(["OK", "ERROR"]),
  notas: z.string().optional().nullable(),
});
