import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireModule } from "../../middlewares/module.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { requireSuperAdmin } from "../../middlewares/superAdmin.middleware.js";

import {
  dashboardResumenController,
  dashboardHabitacionesController,
  dashboardFinanzasController,
  dashboardAlertasController,
  dashboardReservasController,
  dashboardSaasController,
  reportesSaasController,
} from "./dashboard.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);
router.use(requireModule("dashboard"));

router.get("/saas", requireSuperAdmin, dashboardSaasController);
router.get("/saas-reportes", requireSuperAdmin, reportesSaasController);

router.get(
  "/resumen",
  requirePermission("dashboard.ver"),
  dashboardResumenController
);

router.get(
  "/habitaciones",
  requirePermission("dashboard.ver"),
  dashboardHabitacionesController
);

router.get(
  "/finanzas",
  requirePermission("dashboard.ver"),
  dashboardFinanzasController
);

router.get(
  "/alertas",
  requirePermission("dashboard.ver"),
  dashboardAlertasController
);

router.get(
  "/reservas",
  requirePermission("dashboard.ver"),
  dashboardReservasController
);

export default router;
