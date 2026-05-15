import { query } from "../../config/db.js";

export const listarAuditoria = async (tenant, filters = {}) => {
  const params = [];
  const where = [];

  if (!tenant?.isSuperAdmin) {
    params.push(tenant.id_empresa);
    where.push(`a.id_empresa = $${params.length}`);
  } else if (filters.id_empresa) {
    params.push(filters.id_empresa);
    where.push(`a.id_empresa = $${params.length}`);
  }

  if (filters.id_sucursal) {
    params.push(filters.id_sucursal);
    where.push(`a.id_sucursal = $${params.length}`);
  }

  if (filters.modulo) {
    params.push(filters.modulo);
    where.push(`a.modulo = $${params.length}`);
  }

  if (filters.accion) {
    params.push(filters.accion);
    where.push(`a.accion = $${params.length}`);
  }

  if (filters.fecha_desde) {
    params.push(filters.fecha_desde);
    where.push(`a.created_at >= $${params.length}::timestamptz`);
  }

  if (filters.fecha_hasta) {
    params.push(filters.fecha_hasta);
    where.push(`a.created_at <= $${params.length}::timestamptz`);
  }

  const page = Math.max(Number(filters.page || 1), 1);
  const limit = Math.min(Math.max(Number(filters.limit || 50), 1), 200);
  const offset = (page - 1) * limit;

  params.push(limit, offset);

  const result = await query(
    `
    SELECT
      a.*,
      e.nombre_comercial AS empresa,
      s.nombre AS sucursal,
      u.email AS usuario_email,
      CONCAT_WS(' ', u.nombres, u.apellidos) AS usuario_nombre
    FROM "Auditoria" a
    LEFT JOIN "Empresa" e ON e.id_empresa = a.id_empresa
    LEFT JOIN "Sucursal" s ON s.id_sucursal = a.id_sucursal
    LEFT JOIN "Usuario" u ON u.id_usuario = a.id_usuario
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY a.created_at DESC
    LIMIT $${params.length - 1}
    OFFSET $${params.length};
    `,
    params
  );

  return {
    page,
    limit,
    items: result.rows,
  };
};
