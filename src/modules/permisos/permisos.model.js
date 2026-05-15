import { query } from "../../config/db.js";

export const listarPermisos = async ({ isSuperAdmin = false } = {}) => {
  const forbiddenModules = ["superadmin", "empresas", "planes", "licencias", "suscripciones"];
  const result = await query(
    `
    SELECT
      p.*,
      m.nombre AS modulo_nombre,
      m.clave AS modulo_clave
    FROM "Permiso" p
    LEFT JOIN "Modulo" m ON m.id_modulo = p.id_modulo
    WHERE p.activo = true
    ${isSuperAdmin ? "" : "AND p.modulo <> ALL($1::text[]) AND p.clave NOT LIKE '%.global'"}
    ORDER BY p.modulo ASC, p.accion ASC, p.clave ASC;
    `,
    isSuperAdmin ? [] : [forbiddenModules]
  );

  return result.rows;
};
