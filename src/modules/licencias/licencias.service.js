import { AppError } from "../../utils/AppError.js";
import { withTransaction } from "../../config/db.js";
import { registrarAuditoria } from "../../utils/audit.js";
import { aplicarPlanAEmpresa } from "../../utils/saasPlan.js";
import {
  actualizarLicencia,
  cambiarEstadoLicencia,
  crearLicencia,
  listarLicencias,
  obtenerLicenciaPorUuid,
} from "./licencias.model.js";

export const listarLicenciasService = async (tenant) => listarLicencias(tenant);

export const obtenerLicenciaService = async (uuid_licencia, tenant) => {
  const licencia = await obtenerLicenciaPorUuid(uuid_licencia, tenant);

  if (!licencia) {
    throw new AppError("Licencia no encontrada", 404, null, "LICENSE_NOT_FOUND");
  }

  return licencia;
};

export const crearLicenciaService = async (data, tenant, actor = null) => {
  if (!tenant?.isSuperAdmin) {
    throw new AppError("Solo superadmin puede crear licencias", 403, null, "PERMISSION_DENIED");
  }

  return withTransaction(async (client) => {
    const result = await client.query(
      `
      INSERT INTO "Licencia" (
        id_empresa,
        id_plan,
        fecha_inicio,
        fecha_fin,
        estado,
        observaciones
      )
      VALUES ($1,$2,COALESCE($3::date, CURRENT_DATE),$4,$5,$6)
      RETURNING *;
      `,
      [
        data.id_empresa,
        data.id_plan,
        data.fecha_inicio || null,
        data.fecha_fin || null,
        data.estado || "ACTIVA",
        data.observaciones || null,
      ]
    );
    const licencia = result.rows[0];

    if (["ACTIVA", "PRUEBA"].includes(licencia.estado)) {
      await aplicarPlanAEmpresa(client, licencia.id_empresa, licencia.id_plan);
    }

    await registrarAuditoria({
      client,
      id_empresa: licencia.id_empresa,
      id_usuario: actor?.id_usuario || null,
      modulo: "licencias",
      tabla_afectada: "Licencia",
      id_registro: licencia.id_licencia,
      accion: "LICENCIA_CREADA",
      descripcion: "Licencia creada",
      valores_nuevos: licencia,
    });

    return licencia;
  });
};

export const actualizarLicenciaService = async (
  uuid_licencia,
  data,
  tenant,
  actor = null
) => {
  if (!tenant?.isSuperAdmin) {
    throw new AppError("Solo superadmin puede editar licencias", 403, null, "PERMISSION_DENIED");
  }

  return withTransaction(async (client) => {
    const result = await client.query(
      `
      UPDATE "Licencia"
      SET id_plan = COALESCE($1, id_plan),
          fecha_inicio = COALESCE($2::date, fecha_inicio),
          fecha_fin = $3,
          estado = COALESCE($4, estado),
          observaciones = COALESCE($5, observaciones),
          updated_at = NOW()
      WHERE uuid_licencia = $6
      AND deleted_at IS NULL
      RETURNING *;
      `,
      [
        data.id_plan ?? null,
        data.fecha_inicio || null,
        data.fecha_fin ?? null,
        data.estado ?? null,
        data.observaciones ?? null,
        uuid_licencia,
      ]
    );
    const licencia = result.rows[0] || null;

    if (!licencia) {
      throw new AppError("Licencia no encontrada", 404, null, "LICENSE_NOT_FOUND");
    }

    if (["ACTIVA", "PRUEBA"].includes(licencia.estado)) {
      await aplicarPlanAEmpresa(client, licencia.id_empresa, licencia.id_plan);
    }

    await registrarAuditoria({
      client,
      id_empresa: licencia.id_empresa,
      id_usuario: actor?.id_usuario || null,
      modulo: "licencias",
      tabla_afectada: "Licencia",
      id_registro: licencia.id_licencia,
      accion: "LICENCIA_ACTUALIZADA",
      descripcion: "Licencia actualizada",
      valores_nuevos: licencia,
    });

    return licencia;
  });
};

export const cambiarEstadoLicenciaService = async (
  uuid_licencia,
  estado,
  observaciones,
  tenant,
  actor = null
) => {
  if (!tenant?.isSuperAdmin) {
    throw new AppError("Solo superadmin puede editar licencias", 403, null, "PERMISSION_DENIED");
  }

  return withTransaction(async (client) => {
    const result = await client.query(
      `
      UPDATE "Licencia"
      SET estado = $1,
          observaciones = COALESCE($2, observaciones),
          updated_at = NOW()
      WHERE uuid_licencia = $3
      AND deleted_at IS NULL
      RETURNING *;
      `,
      [estado, observaciones || null, uuid_licencia]
    );
    const licencia = result.rows[0] || null;

    if (!licencia) {
      throw new AppError("Licencia no encontrada", 404, null, "LICENSE_NOT_FOUND");
    }

    if (["ACTIVA", "PRUEBA"].includes(licencia.estado)) {
      await aplicarPlanAEmpresa(client, licencia.id_empresa, licencia.id_plan);
    }

    await registrarAuditoria({
      client,
      id_empresa: licencia.id_empresa,
      id_usuario: actor?.id_usuario || null,
      modulo: "licencias",
      tabla_afectada: "Licencia",
      id_registro: licencia.id_licencia,
      accion: "LICENCIA_ESTADO_CAMBIADO",
      descripcion: `Estado de licencia cambiado a ${estado}`,
      valores_nuevos: licencia,
    });

    return licencia;
  });
};
