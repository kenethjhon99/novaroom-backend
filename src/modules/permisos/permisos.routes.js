import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireAnyPermission } from "../../middlewares/permission.middleware.js";
import { listarPermisosController } from "./permisos.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);

router.get(
  "/",
  requireAnyPermission(["permisos.ver", "roles.crear", "roles.editar"]),
  listarPermisosController
);

export default router;
