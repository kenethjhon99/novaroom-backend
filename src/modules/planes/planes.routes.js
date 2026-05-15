import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { requireSuperAdmin } from "../../middlewares/superAdmin.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  actualizarPlanController,
  cambiarEstadoPlanController,
  crearPlanController,
  listarPlanesController,
  obtenerPlanController,
} from "./planes.controller.js";
import {
  actualizarPlanSchema,
  cambiarEstadoPlanSchema,
  crearPlanSchema,
} from "./planes.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireSuperAdmin);

router.get("/", requirePermission("planes.ver"), listarPlanesController);
router.get("/:uuid", requirePermission("planes.ver"), obtenerPlanController);
router.post("/", requirePermission("planes.crear"), validate(crearPlanSchema), crearPlanController);
router.patch(
  "/:uuid",
  requirePermission("planes.editar"),
  validate(actualizarPlanSchema),
  actualizarPlanController
);
router.patch(
  "/:uuid/estado",
  requirePermission("planes.editar"),
  validate(cambiarEstadoPlanSchema),
  cambiarEstadoPlanController
);

export default router;
