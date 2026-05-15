import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireModule } from "../../middlewares/module.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { requireSuperAdminSupportMode } from "../../middlewares/support.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  listarHabitacionesController,
  obtenerHabitacionController,
  crearHabitacionController,
  actualizarHabitacionController,
  cambiarEstadoHabitacionController,
  eliminarHabitacionController,
  obtenerMapaHabitacionesController,
} from "./habitaciones.controller.js";

import {
  crearHabitacionSchema,
  actualizarHabitacionSchema,
  cambiarEstadoHabitacionSchema,
} from "./habitaciones.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireSuperAdminSupportMode("habitaciones"));
router.use(licenseMiddleware);
router.use(requireModule("habitaciones"));


router.get(
  "/",
  requirePermission("habitaciones.ver"),
  listarHabitacionesController
);

router.get(
  "/mapa",
  requirePermission("habitaciones.ver_mapa"),
  obtenerMapaHabitacionesController
);

router.get(
  "/:uuid",
  requirePermission("habitaciones.ver"),
  obtenerHabitacionController
);

router.post(
  "/",
  requirePermission("habitaciones.crear"),
  validate(crearHabitacionSchema),
  crearHabitacionController
);

router.patch(
  "/:uuid",
  requirePermission("habitaciones.editar"),
  validate(actualizarHabitacionSchema),
  actualizarHabitacionController
);

router.patch(
  "/:uuid/estado",
  requirePermission("habitaciones.cambiar_estado"),
  validate(cambiarEstadoHabitacionSchema),
  cambiarEstadoHabitacionController
);

router.delete(
  "/:uuid",
  requirePermission("habitaciones.editar"),
  eliminarHabitacionController
);

export default router;
