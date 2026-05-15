import { z } from "zod";

export const venderExtraSchema = z.object({
  uuid_ocupacion: z.string().uuid(),
  id_bodega: z.number().int().positive(),
  items: z.array(
    z.object({
      id_producto: z.number().int().positive(),
      cantidad: z.number().positive(),
    })
  ).min(1),
});