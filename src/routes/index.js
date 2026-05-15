import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import meRoutes from "../modules/me/me.routes.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../middlewares/tenant.middleware.js";
import { licenseMiddleware } from "../middlewares/license.middleware.js";
import { requireModule } from "../middlewares/module.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";
import empresasRoutes from "../modules/empresas/empresas.routes.js";
import sucursalesRoutes from "../modules/sucursales/sucursales.routes.js";
import areasRoutes from "../modules/areas/areas.routes.js";
import nivelesRoutes from "../modules/niveles/niveles.routes.js";
import habitacionesRoutes from "../modules/habitaciones/habitaciones.routes.js";
import tiposHabitacionRoutes from "../modules/tipos-habitacion/tiposHabitacion.routes.js";
import serviciosHabitacionRoutes from "../modules/servicios-habitacion/serviciosHabitacion.routes.js";
import ocupacionesRoutes from "../modules/ocupaciones/ocupaciones.routes.js";
import inventarioRoutes from "../modules/inventario/inventario.routes.js";
import extrasRoutes from "../modules/extras/extras.routes.js";
import cajaRoutes from "../modules/caja/caja.routes.js";
import reservasRoutes from "../modules/reservas/reservas.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import usuariosRoutes from "../modules/usuarios/usuarios.routes.js";
import rolesRoutes from "../modules/roles/roles.routes.js";
import permisosRoutes from "../modules/permisos/permisos.routes.js";
import modulosRoutes from "../modules/modulos/modulos.routes.js";
import planesRoutes from "../modules/planes/planes.routes.js";
import licenciasRoutes from "../modules/licencias/licencias.routes.js";
import suscripcionesRoutes from "../modules/suscripciones/suscripciones.routes.js";
import auditoriaRoutes from "../modules/auditoria/auditoria.routes.js";
import apiKeysRoutes from "../modules/api-keys/apiKeys.routes.js";
import webhooksRoutes from "../modules/webhooks/webhooks.routes.js";
import dominiosRoutes from "../modules/dominios/dominios.routes.js";
import tenantDatabasesRoutes from "../modules/tenant-databases/tenantDatabases.routes.js";
import { openApiDocument } from "../docs/openapi.js";
import { env } from "../config/env.js";
import { query } from "../config/db.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API NovaRoom saludable",
    data: {
      service: "novaroom-api",
      env: env.nodeEnv,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

router.get("/health/db", async (req, res) => {
  const startedAt = Date.now();

  try {
    await query("SELECT 1");

    res.json({
      success: true,
      message: "Base de datos disponible",
      data: {
        service: "postgres",
        latency_ms: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Base de datos no disponible",
      data: null,
      error: {
        code: "DB_UNAVAILABLE",
        details: env.nodeEnv === "production" ? null : error.message,
      },
    });
  }
});

router.get("/ready", async (req, res) => {
  try {
    await query("SELECT 1");

    res.json({
      success: true,
      message: "Servicio listo",
      data: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    res.status(503).json({
      success: false,
      message: "Servicio no listo",
      data: null,
      error: {
        code: "SERVICE_NOT_READY",
        details: null,
      },
    });
  }
});

router.get("/live", (req, res) => {
  res.json({
    success: true,
    message: "Servicio vivo",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

router.get("/openapi.json", (req, res) => {
  res.json(openApiDocument);
});

router.use("/auth", authRoutes);
router.use("/me", meRoutes);
router.use("/empresas", empresasRoutes);
router.use("/sucursales", sucursalesRoutes);
router.use("/areas", areasRoutes);
router.use("/niveles", nivelesRoutes);
router.use("/habitaciones", habitacionesRoutes);
router.use("/tipos-habitacion", tiposHabitacionRoutes);
router.use("/servicios-habitacion", serviciosHabitacionRoutes);
router.use("/ocupaciones", ocupacionesRoutes);
router.use("/inventario", inventarioRoutes);
router.use("/extras", extrasRoutes);
router.use("/caja", cajaRoutes);
router.use("/reservas", reservasRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/usuarios", usuariosRoutes);
router.use("/roles", rolesRoutes);
router.use("/permisos", permisosRoutes);
router.use("/modulos", modulosRoutes);
router.use("/planes", planesRoutes);
router.use("/licencias", licenciasRoutes);
router.use("/suscripciones", suscripcionesRoutes);
router.use("/auditoria", auditoriaRoutes);
router.use("/api-keys", apiKeysRoutes);
router.use("/webhooks", webhooksRoutes);
router.use("/dominios", dominiosRoutes);
router.use("/tenant-databases", tenantDatabasesRoutes);

router.get(
  "/test-protegido",
  authMiddleware,
  tenantMiddleware,
  licenseMiddleware,
  requireModule("dashboard"),
  requirePermission("dashboard.ver"),
  (req, res) => {
    res.json({
      success: true,
      message: "Ruta protegida funcionando",
      user: req.user,
      tenant: req.tenant,
    });
  }
);

export default router;
