import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireModule } from "../../middlewares/module.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  listarSucursalesController,
  obtenerSucursalController,
  crearSucursalController,
  actualizarSucursalController,
  cambiarEstadoSucursalController,
  eliminarSucursalController,
} from "./sucursales.controller.js";

import {
  crearSucursalSchema,
  actualizarSucursalSchema,
  cambiarEstadoSucursalSchema,
} from "./sucursales.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);
router.use(requireModule("sucursales"));

router.get(
  "/",
  requirePermission("sucursales.ver"),
  listarSucursalesController
);

router.get(
  "/:uuid",
  requirePermission("sucursales.ver"),
  obtenerSucursalController
);

router.post(
  "/",
  requirePermission("sucursales.crear"),
  validate(crearSucursalSchema),
  crearSucursalController
);

router.patch(
  "/:uuid",
  requirePermission("sucursales.editar"),
  validate(actualizarSucursalSchema),
  actualizarSucursalController
);

router.patch(
  "/:uuid/estado",
  requirePermission("sucursales.editar"),
  validate(cambiarEstadoSucursalSchema),
  cambiarEstadoSucursalController
);

router.delete(
  "/:uuid",
  requirePermission("sucursales.editar"),
  eliminarSucursalController
);

export default router;