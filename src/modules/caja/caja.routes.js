import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireModule } from "../../middlewares/module.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { requireSuperAdminSupportMode } from "../../middlewares/support.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  obtenerCajaActualController,
  abrirCajaController,
  listarMovimientosCajaController,
  cerrarCajaController,
} from "./caja.controller.js";

import {
  abrirCajaSchema,
  cerrarCajaSchema,
} from "./caja.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireSuperAdminSupportMode("caja"));
router.use(licenseMiddleware);
router.use(requireModule("caja"));

router.get(
  "/actual",
  requirePermission("caja.ver"),
  obtenerCajaActualController
);

router.post(
  "/abrir",
  requirePermission("caja.abrir"),
  validate(abrirCajaSchema),
  abrirCajaController
);

router.get(
  "/:idCaja/movimientos",
  requirePermission("caja.movimientos"),
  listarMovimientosCajaController
);

router.post(
  "/cerrar/:uuid",
  requirePermission("caja.cerrar"),
  validate(cerrarCajaSchema),
  cerrarCajaController
);

export default router;
