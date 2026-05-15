import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  actualizarWebhookController,
  crearWebhookController,
  listarLogsIntegracionController,
  listarWebhooksController,
  probarWebhookController,
} from "./webhooks.controller.js";
import {
  actualizarWebhookSchema,
  crearWebhookSchema,
  probarWebhookSchema,
} from "./webhooks.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);

router.get("/", requirePermission("webhooks.ver"), listarWebhooksController);
router.post(
  "/",
  requirePermission("webhooks.crear"),
  validate(crearWebhookSchema),
  crearWebhookController
);
router.patch(
  "/:uuid",
  requirePermission("webhooks.editar"),
  validate(actualizarWebhookSchema),
  actualizarWebhookController
);
router.post(
  "/:uuid/probar",
  requirePermission("webhooks.editar"),
  validate(probarWebhookSchema),
  probarWebhookController
);
router.get(
  "/logs/entregas",
  requirePermission("integration_logs.ver"),
  listarLogsIntegracionController
);

export default router;
