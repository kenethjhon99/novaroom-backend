import { z } from "zod";

export const crearWebhookSchema = z.object({
  nombre: z.string().min(2).max(120),
  url: z.string().url(),
  eventos: z.array(z.string().min(1)).default([]),
  activo: z.boolean().default(true),
});

export const actualizarWebhookSchema = crearWebhookSchema.partial();

export const probarWebhookSchema = z.object({
  evento: z.string().min(1).default("webhook.test"),
  payload: z.record(z.string(), z.any()).default({}),
});
