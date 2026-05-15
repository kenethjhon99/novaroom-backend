import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { listarAuditoriaController } from "./auditoria.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);

router.get("/", requirePermission("auditoria.ver"), listarAuditoriaController);

export default router;
