import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { requireSuperAdmin } from "../../middlewares/superAdmin.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  actualizarLicenciaController,
  cambiarEstadoLicenciaController,
  crearLicenciaController,
  listarLicenciasController,
  obtenerLicenciaController,
} from "./licencias.controller.js";
import {
  actualizarLicenciaSchema,
  cambiarEstadoLicenciaSchema,
  crearLicenciaSchema,
} from "./licencias.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireSuperAdmin);

router.get("/", requirePermission("licencias.ver"), listarLicenciasController);
router.get("/:uuid", requirePermission("licencias.ver"), obtenerLicenciaController);
router.post(
  "/",
  requirePermission("licencias.crear"),
  validate(crearLicenciaSchema),
  crearLicenciaController
);
router.patch(
  "/:uuid",
  requirePermission("licencias.editar"),
  validate(actualizarLicenciaSchema),
  actualizarLicenciaController
);
router.patch(
  "/:uuid/estado",
  requirePermission("licencias.editar"),
  validate(cambiarEstadoLicenciaSchema),
  cambiarEstadoLicenciaController
);

export default router;
