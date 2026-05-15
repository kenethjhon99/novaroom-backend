import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireModule } from "../../middlewares/module.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { requireSuperAdminSupportMode } from "../../middlewares/support.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  venderExtraController,
  listarExtrasOcupacionController,
} from "./extras.controller.js";

import { venderExtraSchema } from "./extras.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireSuperAdminSupportMode("extras"));
router.use(licenseMiddleware);
router.use(requireModule("extras"));

router.post(
  "/vender",
  requirePermission("extras.vender"),
  validate(venderExtraSchema),
  venderExtraController
);

router.get(
  "/ocupacion/:uuidOcupacion",
  requirePermission("extras.vender"),
  listarExtrasOcupacionController
);

export default router;
