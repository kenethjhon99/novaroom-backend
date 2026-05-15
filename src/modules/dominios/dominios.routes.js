import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireModule } from "../../middlewares/module.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  actualizarDominioController,
  crearDominioController,
  eliminarDominioController,
  listarDominiosController,
  verificarDominioController,
} from "./dominios.controller.js";
import {
  actualizarDominioSchema,
  crearDominioSchema,
} from "./dominios.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);
router.use(requireModule("dominios"));

router.get("/", requirePermission("dominios.ver"), listarDominiosController);
router.post(
  "/",
  requirePermission("dominios.crear"),
  validate(crearDominioSchema),
  crearDominioController
);
router.patch(
  "/:uuid",
  requirePermission("dominios.editar"),
  validate(actualizarDominioSchema),
  actualizarDominioController
);
router.post(
  "/:uuid/verificar",
  requirePermission("dominios.editar"),
  verificarDominioController
);
router.delete(
  "/:uuid",
  requirePermission("dominios.editar"),
  eliminarDominioController
);

export default router;
