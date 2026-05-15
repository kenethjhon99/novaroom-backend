import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { requireSuperAdmin } from "../../middlewares/superAdmin.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  actualizarSuscripcionController,
  cambiarEstadoSuscripcionController,
  crearSuscripcionController,
  listarSuscripcionesController,
  obtenerSuscripcionController,
} from "./suscripciones.controller.js";
import {
  actualizarSuscripcionSchema,
  cambiarEstadoSuscripcionSchema,
  crearSuscripcionSchema,
} from "./suscripciones.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireSuperAdmin);

router.get("/", requirePermission("suscripciones.ver"), listarSuscripcionesController);
router.get("/:uuid", requirePermission("suscripciones.ver"), obtenerSuscripcionController);
router.post(
  "/",
  requirePermission("suscripciones.crear"),
  validate(crearSuscripcionSchema),
  crearSuscripcionController
);
router.patch(
  "/:uuid",
  requirePermission("suscripciones.editar"),
  validate(actualizarSuscripcionSchema),
  actualizarSuscripcionController
);
router.patch(
  "/:uuid/estado",
  requirePermission("suscripciones.editar"),
  validate(cambiarEstadoSuscripcionSchema),
  cambiarEstadoSuscripcionController
);

export default router;
