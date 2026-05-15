import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireModule } from "../../middlewares/module.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { requireSuperAdminSupportMode } from "../../middlewares/support.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  crearReservaController,
  listarReservasController,
  confirmarReservaController,
  cancelarReservaController,
  checkinReservaController,
} from "./reservas.controller.js";

import {
  crearReservaSchema,
  confirmarReservaSchema,
  cancelarReservaSchema,
  checkinReservaSchema,
} from "./reservas.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireSuperAdminSupportMode("reservas"));
router.use(licenseMiddleware);
router.use(requireModule("reservas"));

router.get("/", requirePermission("reservas.ver"), listarReservasController);

router.post(
  "/",
  requirePermission("reservas.crear"),
  validate(crearReservaSchema),
  crearReservaController
);

router.post(
  "/:uuid/confirmar",
  requirePermission("reservas.confirmar"),
  validate(confirmarReservaSchema),
  confirmarReservaController
);

router.post(
  "/:uuid/cancelar",
  requirePermission("reservas.cancelar"),
  validate(cancelarReservaSchema),
  cancelarReservaController
);

router.post(
  "/:uuid/checkin",
  requirePermission("reservas.checkin"),
  validate(checkinReservaSchema),
  checkinReservaController
);

export default router;
