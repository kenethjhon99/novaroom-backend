import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireModule } from "../../middlewares/module.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  listarTiposHabitacionController,
  crearTipoHabitacionController,
  actualizarTipoHabitacionController,
  eliminarTipoHabitacionController,
} from "./tiposHabitacion.controller.js";

import {
  crearTipoHabitacionSchema,
  actualizarTipoHabitacionSchema,
} from "./tiposHabitacion.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);
router.use(requireModule("habitaciones"));

router.get("/", requirePermission("habitaciones.ver"), listarTiposHabitacionController);

router.post(
  "/",
  requirePermission("habitaciones.crear"),
  validate(crearTipoHabitacionSchema),
  crearTipoHabitacionController
);

router.patch(
  "/:uuid",
  requirePermission("habitaciones.editar"),
  validate(actualizarTipoHabitacionSchema),
  actualizarTipoHabitacionController
);

router.delete(
  "/:uuid",
  requirePermission("habitaciones.editar"),
  eliminarTipoHabitacionController
);

export default router;