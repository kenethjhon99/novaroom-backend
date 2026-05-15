import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireModule } from "../../middlewares/module.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  listarServiciosHabitacionController,
  crearServicioHabitacionController,
  actualizarServicioHabitacionController,
  eliminarServicioHabitacionController,
  asignarServiciosHabitacionController,
  listarServiciosDeHabitacionController,
} from "./serviciosHabitacion.controller.js";

import {
  crearServicioHabitacionSchema,
  actualizarServicioHabitacionSchema,
  asignarServiciosHabitacionSchema,
} from "./serviciosHabitacion.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);
router.use(requireModule("habitaciones"));

router.get("/", requirePermission("habitaciones.ver"), listarServiciosHabitacionController);

router.post(
  "/",
  requirePermission("habitaciones.crear"),
  validate(crearServicioHabitacionSchema),
  crearServicioHabitacionController
);

router.patch(
  "/:uuid",
  requirePermission("habitaciones.editar"),
  validate(actualizarServicioHabitacionSchema),
  actualizarServicioHabitacionController
);

router.delete(
  "/:uuid",
  requirePermission("habitaciones.editar"),
  eliminarServicioHabitacionController
);

router.get(
  "/habitacion/:uuidHabitacion",
  requirePermission("habitaciones.ver"),
  listarServiciosDeHabitacionController
);

router.post(
  "/habitacion/:uuidHabitacion",
  requirePermission("habitaciones.editar"),
  validate(asignarServiciosHabitacionSchema),
  asignarServiciosHabitacionController
);

export default router;