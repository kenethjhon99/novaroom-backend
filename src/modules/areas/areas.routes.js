import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireModule } from "../../middlewares/module.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  listarAreasController,
  obtenerAreaController,
  crearAreaController,
  actualizarAreaController,
  cambiarEstadoAreaController,
  eliminarAreaController,
} from "./areas.controller.js";

import {
  crearAreaSchema,
  actualizarAreaSchema,
  cambiarEstadoAreaSchema,
} from "./areas.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);
router.use(requireModule("areas"));

router.get("/", requirePermission("areas.ver"), listarAreasController);

router.get("/:uuid", requirePermission("areas.ver"), obtenerAreaController);

router.post(
  "/",
  requirePermission("areas.crear"),
  validate(crearAreaSchema),
  crearAreaController
);

router.patch(
  "/:uuid",
  requirePermission("areas.editar"),
  validate(actualizarAreaSchema),
  actualizarAreaController
);

router.patch(
  "/:uuid/estado",
  requirePermission("areas.editar"),
  validate(cambiarEstadoAreaSchema),
  cambiarEstadoAreaController
);

router.delete(
  "/:uuid",
  requirePermission("areas.editar"),
  eliminarAreaController
);

export default router;