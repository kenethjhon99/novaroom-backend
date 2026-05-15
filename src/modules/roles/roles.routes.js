import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  actualizarRolController,
  cambiarEstadoRolController,
  crearRolController,
  listarRolesController,
  obtenerRolController,
} from "./roles.controller.js";
import {
  actualizarRolSchema,
  cambiarEstadoRolSchema,
  crearRolSchema,
} from "./roles.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);

router.get("/", requirePermission("roles.ver"), listarRolesController);
router.get("/:uuid", requirePermission("roles.ver"), obtenerRolController);
router.post("/", requirePermission("roles.crear"), validate(crearRolSchema), crearRolController);
router.patch(
  "/:uuid",
  requirePermission("roles.editar"),
  validate(actualizarRolSchema),
  actualizarRolController
);
router.patch(
  "/:uuid/estado",
  requirePermission("roles.editar"),
  validate(cambiarEstadoRolSchema),
  cambiarEstadoRolController
);

export default router;
