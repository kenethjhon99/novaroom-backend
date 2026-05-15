import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export const requireModule = (moduleKey) => {
  return async (req, res, next) => {
    if (req.tenant?.isSuperAdmin) {
      return next();
    }

    const id_empresa = req.tenant?.id_empresa;

    const result = await query(
      `
      SELECT em.id_empresa_modulo
      FROM "Empresa_modulo" em
      INNER JOIN "Modulo" m ON m.id_modulo = em.id_modulo
      WHERE em.id_empresa = $1
      AND m.clave = $2
      AND em.activo = true
      AND m.activo = true
      LIMIT 1;
      `,
      [id_empresa, moduleKey]
    );

    if (!result.rows[0]) {
      throw new AppError(
        "Modulo no disponible para esta empresa",
        403,
        { module: moduleKey },
        "MODULE_NOT_AVAILABLE"
      );
    }

    next();
  };
};
