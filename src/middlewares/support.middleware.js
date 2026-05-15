import { AppError } from "../utils/AppError.js";
import { registrarAuditoria } from "../utils/audit.js";

export const requireSuperAdminSupportMode = (modulo) => {
  return async (req, res, next) => {
    if (!req.tenant?.isSuperAdmin || !req.tenant?.id_empresa) {
      return next();
    }

    const reason =
      req.headers["x-support-reason"] ||
      req.body?.support_reason ||
      req.query?.support_reason;
    const ticket =
      req.headers["x-support-ticket"] ||
      req.body?.support_ticket ||
      req.query?.support_ticket ||
      null;

    if (!reason || String(reason).trim().length < 10) {
      throw new AppError(
        "Modo soporte requerido para operar una empresa como Super Admin",
        403,
        { header: "x-support-reason" },
        "SUPPORT_MODE_REQUIRED"
      );
    }

    await registrarAuditoria({
      id_empresa: req.tenant.id_empresa,
      id_sucursal: req.tenant.id_sucursal,
      id_usuario: req.user?.id_usuario,
      modulo: "soporte",
      accion: "SUPER_ADMIN_SUPPORT_ACCESS",
      descripcion: `Acceso de soporte a ${modulo}`,
      valores_nuevos: {
        modulo,
        method: req.method,
        path: req.originalUrl,
        reason,
        ticket,
      },
      meta: { req },
    });

    return next();
  };
};
