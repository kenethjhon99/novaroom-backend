import { Router } from "express";
import { z } from "zod";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  cambiarSucursalActivaController,
  contextoController,
} from "./me.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/contexto", contextoController);
router.patch(
  "/sucursal-activa",
  validate(
    z.object({
      id_sucursal: z.coerce.number().int().positive(),
    })
  ),
  cambiarSucursalActivaController
);

export default router;
