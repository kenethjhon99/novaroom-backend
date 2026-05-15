import { z } from "zod";

export const crearApiKeySchema = z.object({
  nombre: z.string().min(2).max(120),
  scopes: z.array(z.string().min(1)).default([]),
  expira_at: z.string().optional().nullable(),
});

export const revocarApiKeySchema = z.object({
  motivo: z.string().optional().nullable(),
});
