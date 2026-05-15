import { z } from "zod";

export const abrirOcupacionSchema = z.object({
  uuid_habitacion: z.string().uuid(),
  tipo_ocupacion: z
    .enum(["POR_HORA", "POR_NOCHE", "COMBO_HORAS", "ESTADIA", "CORTESIA"])
    .default("POR_HORA"),
  precio_base: z.coerce.number().nonnegative().optional(),
  combo_horas: z.coerce.number().int().positive().optional(),
  tarifa_nombre: z.string().max(120).optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

export const cerrarOcupacionSchema = z.object({
  metodo_pago: z.enum([
    "EFECTIVO",
    "TARJETA",
    "TRANSFERENCIA",
    "MIXTO",
    "CORTESIA",
  ]),

  descuento: z.coerce.number().nonnegative().optional().default(0),
  referencia: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  enviado_limpieza: z.boolean().optional().default(true),
});

export const finalizarLimpiezaSchema = z.object({
  observaciones: z.string().optional().nullable(),
});
