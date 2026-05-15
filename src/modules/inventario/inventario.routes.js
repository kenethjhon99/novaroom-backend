import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requireModule } from "../../middlewares/module.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { requireSuperAdminSupportMode } from "../../middlewares/support.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  listarCategoriasController,
  crearCategoriaController,
  listarProductosController,
  crearProductoController,
  listarBodegasController,
  crearBodegaController,
  listarInventarioController,
  agregarStockController,
} from "./inventario.controller.js";

import {
  crearCategoriaSchema,
  crearProductoSchema,
  crearBodegaSchema,
  agregarStockSchema,
} from "./inventario.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireSuperAdminSupportMode("inventario"));
router.use(licenseMiddleware);
router.use(requireModule("inventario"));

router.get(
  "/categorias",
  requirePermission("inventario.ver"),
  listarCategoriasController
);

router.post(
  "/categorias",
  requirePermission("inventario.productos_crear"),
  validate(crearCategoriaSchema),
  crearCategoriaController
);

router.get(
  "/productos",
  requirePermission("inventario.ver"),
  listarProductosController
);

router.post(
  "/productos",
  requirePermission("inventario.productos_crear"),
  validate(crearProductoSchema),
  crearProductoController
);

router.get(
  "/bodegas",
  requirePermission("inventario.ver"),
  listarBodegasController
);

router.post(
  "/bodegas",
  requirePermission("inventario.ajustar"),
  validate(crearBodegaSchema),
  crearBodegaController
);

router.get(
  "/",
  requirePermission("inventario.ver"),
  listarInventarioController
);

router.post(
  "/agregar-stock",
  requirePermission("inventario.ajustar"),
  validate(agregarStockSchema),
  agregarStockController
);

export default router;
