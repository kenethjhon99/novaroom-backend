import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireModule } from "../../middlewares/module.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  listarNivelesController,
  obtenerNivelController,
  crearNivelController,
  actualizarNivelController,
  cambiarEstadoNivelController,
  eliminarNivelController,
} from "./niveles.controller.js";

import {
  crearNivelSchema,
  actualizarNivelSchema,
  cambiarEstadoNivelSchema,
} from "./niveles.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);
router.use(requireModule("niveles"));

router.get("/", requirePermission("niveles.ver"), listarNivelesController);

router.get("/:uuid", requirePermission("niveles.ver"), obtenerNivelController);

router.post(
  "/",
  requirePermission("niveles.crear"),
  validate(crearNivelSchema),
  crearNivelController
);

router.patch(
  "/:uuid",
  requirePermission("niveles.editar"),
  validate(actualizarNivelSchema),
  actualizarNivelController
);

router.patch(
  "/:uuid/estado",
  requirePermission("niveles.editar"),
  validate(cambiarEstadoNivelSchema),
  cambiarEstadoNivelController
);

router.delete(
  "/:uuid",
  requirePermission("niveles.editar"),
  eliminarNivelController
);

export default router;