import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../../middlewares/license.middleware.js";
import { requirePermission } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  actualizarUsuarioController,
  cambiarEstadoUsuarioController,
  cambiarPasswordUsuarioController,
  crearUsuarioController,
  listarUsuariosController,
  obtenerUsuarioController,
} from "./usuarios.controller.js";
import {
  actualizarUsuarioSchema,
  cambiarEstadoUsuarioSchema,
  cambiarPasswordUsuarioSchema,
  crearUsuarioSchema,
} from "./usuarios.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(licenseMiddleware);

router.get("/", requirePermission("usuarios.ver"), listarUsuariosController);
router.get("/:uuid", requirePermission("usuarios.ver"), obtenerUsuarioController);
router.post(
  "/",
  requirePermission("usuarios.crear"),
  validate(crearUsuarioSchema),
  crearUsuarioController
);
router.patch(
  "/:uuid",
  requirePermission("usuarios.editar"),
  validate(actualizarUsuarioSchema),
  actualizarUsuarioController
);
router.patch(
  "/:uuid/estado",
  requirePermission("usuarios.editar"),
  validate(cambiarEstadoUsuarioSchema),
  cambiarEstadoUsuarioController
);
router.patch(
  "/:uuid/password",
  requirePermission("usuarios.editar"),
  validate(cambiarPasswordUsuarioSchema),
  cambiarPasswordUsuarioController
);

export default router;
