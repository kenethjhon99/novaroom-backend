import { z } from "zod";

export const crearReservaSchema = z.object({
  uuid_habitacion: z.string().uuid(),

  nombre_cliente: z.string().optional().nullable(),
  telefono_cliente: z.string().optional().nullable(),

  tipo_reserva: z.enum(["POR_HORA", "POR_NOCHE", "ESTADIA"]).default("POR_HORA"),

  fecha_inicio: z.string().datetime(),
  fecha_fin: z.string().datetime(),

  monto_estimado: z.number().nonnegative().optional().default(0),
  anticipo: z.number().nonnegative().optional().default(0),

  observaciones: z.string().optional().nullable(),
});

export const confirmarReservaSchema = z.object({
  observaciones: z.string().optional().nullable(),
});

export const cancelarReservaSchema = z.object({
  motivo: z.string().min(3),
});

export const checkinReservaSchema = z.object({
  observaciones: z.string().optional().nullable(),
});