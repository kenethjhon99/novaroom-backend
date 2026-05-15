import { z } from "zod";

export const actualizarModuloEmpresaSchema = z.object({
  activo: z.boolean(),
  personalizado: z.boolean().optional(),
  beta: z.boolean().optional(),
  costo_extra: z.number().nonnegative().optional(),
});
