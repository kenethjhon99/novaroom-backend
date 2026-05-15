import { Router } from "express";

import {
  listarEmpresasController,
  obtenerEmpresaController,
  crearEmpresaController,
} from "./empresas.controller.js";

import { validate } from "../../middlewares/validate.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";

import { crearEmpresaSchema } from "./empresas.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get(
  "/",
  requirePermission("empresas.ver"),
  listarEmpresasController
);

router.get(
  "/:uuid",
  requirePermission("empresas.ver"),
  obtenerEmpresaController
);

router.post(
  "/",
  requirePermission("empresas.crear"),
  validate(crearEmpresaSchema),
  crearEmpresaController
);

export default router;