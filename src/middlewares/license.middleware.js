import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export const licenseMiddleware = async (req, res, next) => {
  if (req.tenant?.isSuperAdmin) {
    return next();
  }

  const id_empresa = req.tenant?.id_empresa;

  if (!id_empresa) {
    throw new AppError("Empresa no identificada", 403, null, "TENANT_REQUIRED");
  }

  const result = await query(
    `
    SELECT estado, fecha_fin
    FROM "Licencia"
    WHERE id_empresa = $1
    AND deleted_at IS NULL
    ORDER BY id_licencia DESC
    LIMIT 1;
    `,
    [id_empresa]
  );

  const licencia = result.rows[0];

  if (!licencia) {
    throw new AppError("La empresa no tiene licencia activa", 403, null, "LICENSE_REQUIRED");
  }

  if (licencia.estado !== "ACTIVA" && licencia.estado !== "PRUEBA") {
    throw new AppError("Licencia inactiva o suspendida", 403, null, "LICENSE_INACTIVE");
  }

  if (licencia.fecha_fin) {
    const hoy = new Date();
    const fechaFin = new Date(licencia.fecha_fin);

    if (fechaFin < hoy) {
      throw new AppError("Licencia vencida", 403, null, "LICENSE_EXPIRED");
    }
  }

  next();
};
