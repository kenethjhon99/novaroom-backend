import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  actualizarTenantDatabaseController,
  crearTenantDatabaseController,
  listarTenantDatabasesController,
  obtenerTenantDatabaseController,
  registrarHealthTenantDatabaseController,
} from "./tenantDatabases.controller.js";
import {
  actualizarTenantDatabaseSchema,
  crearTenantDatabaseSchema,
  registrarHealthTenantDatabaseSchema,
} from "./tenantDatabases.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/", requirePermission("tenant_database.ver"), listarTenantDatabasesController);
router.get("/:uuid", requirePermission("tenant_database.ver"), obtenerTenantDatabaseController);
router.post(
  "/",
  requirePermission("tenant_database.crear"),
  validate(crearTenantDatabaseSchema),
  crearTenantDatabaseController
);
router.patch(
  "/:uuid",
  requirePermission("tenant_database.editar"),
  validate(actualizarTenantDatabaseSchema),
  actualizarTenantDatabaseController
);
router.post(
  "/:uuid/health",
  requirePermission("tenant_database.verificar"),
  validate(registrarHealthTenantDatabaseSchema),
  registrarHealthTenantDatabaseController
);

export default router;
