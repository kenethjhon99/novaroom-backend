import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  actualizarModuloEmpresaController,
  listarModulosController,
  listarModulosEmpresaController,
} from "./modulos.controller.js";
import { actualizarModuloEmpresaSchema } from "./modulos.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);

router.get("/", requirePermission("modulos.ver"), listarModulosController);
router.get(
  "/empresa",
  requirePermission("modulos.ver"),
  listarModulosEmpresaController
);
router.patch(
  "/empresa/:idModulo",
  requirePermission("modulos.editar"),
  validate(actualizarModuloEmpresaSchema),
  actualizarModuloEmpresaController
);

export default router;
