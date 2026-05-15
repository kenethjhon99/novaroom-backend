import { z } from "zod";

const idSchema = z.coerce.number().int().positive();

export const crearEmpresaSchema = z.object({
  nombre_comercial: z.string().min(2),
  razon_social: z.string().optional().nullable(),
  nit: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  direccion: z.string().optional().nullable(),

  id_plan: idSchema,
  modulos_personalizados: z.array(idSchema).optional().default([]),

  sucursal: z.object({
    nombre: z.string().min(2),
    direccion: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    whatsapp: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
  }),

  admin: z.object({
    nombres: z.string().min(2),
    apellidos: z.string().optional().nullable(),
    email: z.string().email(),
    telefono: z.string().optional().nullable(),
    password: z.string().min(6),
  }),
});
