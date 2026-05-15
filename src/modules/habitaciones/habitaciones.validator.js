import { z } from "zod";

export const crearHabitacionSchema = z.object({
  id_sucursal: z.number().int().positive(),
  id_area: z.number().int().positive().optional().nullable(),
  id_nivel: z.number().int().positive().optional().nullable(),
  id_tipo_habitacion: z.number().int().positive().optional().nullable(),

  numero: z.string().min(1),
  nombre: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),

  precio_hora: z.number().nonnegative().optional().default(0),
  precio_noche: z.number().nonnegative().optional().default(0),
  precio_tiempo_extra: z.number().nonnegative().optional().default(0),
  combo_horas: z.number().int().positive().optional().nullable(),
  precio_combo_horas: z.number().nonnegative().optional().default(0),
  tarifa_combo_nombre: z.string().max(120).optional().nullable(),

  capacidad_personas: z.number().int().positive().optional().default(2),

  tiene_parqueo_privado: z.boolean().optional().default(false),
  permite_reserva: z.boolean().optional().default(false),
  permite_noche: z.boolean().optional().default(true),

  posicion_x: z.number().int().optional().default(0),
  posicion_y: z.number().int().optional().default(0),
  orden_visual: z.number().int().optional().default(0),

  observaciones: z.string().optional().nullable(),
});

export const actualizarHabitacionSchema = crearHabitacionSchema.partial();

export const cambiarEstadoHabitacionSchema = z.object({
  estado: z.enum([
    "DISPONIBLE",
    "OCUPADA",
    "LIMPIEZA",
    "MANTENIMIENTO",
    "REMODELACION",
    "BLOQUEADA",
    "RESERVADA",
    "DESHABILITADA",
  ]),
  motivo: z.string().optional().nullable(),
});
