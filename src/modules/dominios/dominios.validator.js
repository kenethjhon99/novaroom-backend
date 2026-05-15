import { z } from "zod";

const dominioSchema = z
  .string()
  .min(3)
  .max(255)
  .transform((value) =>
    value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "")
  );

export const crearDominioSchema = z.object({
  dominio: dominioSchema,
  tipo: z.enum(["WEB", "PANEL", "RESERVAS", "API"]).default("PANEL"),
  proveedor: z.enum(["VERCEL", "RENDER", "CLOUDFLARE", "MANUAL"]).default("MANUAL"),
  notas: z.string().optional().nullable(),
});

export const actualizarDominioSchema = z.object({
  tipo: z.enum(["WEB", "PANEL", "RESERVAS", "API"]).optional(),
  proveedor: z.enum(["VERCEL", "RENDER", "CLOUDFLARE", "MANUAL"]).optional(),
  estado: z.enum(["PENDIENTE", "VERIFICADO", "ACTIVO", "SUSPENDIDO"]).optional(),
  ssl_activo: z.boolean().optional(),
  notas: z.string().optional().nullable(),
});
