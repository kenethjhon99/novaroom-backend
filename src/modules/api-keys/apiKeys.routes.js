import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  crearApiKeyController,
  listarApiKeysController,
  revocarApiKeyController,
} from "./apiKeys.controller.js";
import { crearApiKeySchema, revocarApiKeySchema } from "./apiKeys.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);

router.get("/", requirePermission("api_keys.ver"), listarApiKeysController);
router.post(
  "/",
  requirePermission("api_keys.crear"),
  validate(crearApiKeySchema),
  crearApiKeyController
);
router.patch(
  "/:uuid/revocar",
  requirePermission("api_keys.editar"),
  validate(revocarApiKeySchema),
  revocarApiKeyController
);

export default router;
