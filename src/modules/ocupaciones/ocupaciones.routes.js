import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireModule } from "../../middlewares/module.middleware.js";
import {
  requireAnyPermission,
  requirePermission,
} from "../../middlewares/permission.middleware.js";
import { requireSuperAdminSupportMode } from "../../middlewares/support.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";


import {
  abrirOcupacionController,
  listarOcupacionesActivasController,
  cerrarOcupacionController,
finalizarLimpiezaController,
listarHistorialOcupacionesController,
} from "./ocupaciones.controller.js";

import { abrirOcupacionSchema,
  cerrarOcupacionSchema,
  finalizarLimpiezaSchema, } from "./ocupaciones.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireSuperAdminSupportMode("ocupaciones"));
router.use(licenseMiddleware);
router.use(requireModule("ocupaciones"));

router.get(
  "/activas",
  requirePermission("ocupaciones.ver"),
  listarOcupacionesActivasController
);

router.post(
  "/abrir",
  requirePermission("ocupaciones.abrir"),
  validate(abrirOcupacionSchema),
  abrirOcupacionController
);

router.get(
  "/historial",
  requirePermission("ocupaciones.ver"),
  listarHistorialOcupacionesController
);

router.post(
  "/cerrar/:uuid",
  requirePermission("ocupaciones.cerrar"),
  validate(cerrarOcupacionSchema),
  cerrarOcupacionController
);

router.post(
  "/limpieza-finalizada/:uuidHabitacion",
  requireAnyPermission([
    "habitaciones.limpieza",
    "habitaciones.cambiar_estado",
    "habitaciones.editar",
  ]),
  validate(finalizarLimpiezaSchema),
  finalizarLimpiezaController
);

export default router;
