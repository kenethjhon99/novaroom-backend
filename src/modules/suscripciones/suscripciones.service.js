import { AppError } from "../../utils/AppError.js";
import { withTransaction } from "../../config/db.js";
import { registrarAuditoria } from "../../utils/audit.js";
import { aplicarPlanAEmpresa } from "../../utils/saasPlan.js";
import {
  actualizarSuscripcion,
  cambiarEstadoSuscripcion,
  crearSuscripcion,
  listarSuscripciones,
  obtenerSuscripcionPorUuid,
} from "./suscripciones.model.js";

export const listarSuscripcionesService = async (tenant) => listarSuscripciones(tenant);

export const obtenerSuscripcionService = async (uuid_suscripcion, tenant) => {
  const suscripcion = await obtenerSuscripcionPorUuid(uuid_suscripcion, tenant);

  if (!suscripcion) {
    throw new AppError("Suscripcion no encontrada", 404, null, "SUBSCRIPTION_NOT_FOUND");
  }

  return suscripcion;
};

export const crearSuscripcionService = async (data, tenant, actor = null) => {
  if (!tenant?.isSuperAdmin) {
    throw new AppError("Solo superadmin puede crear suscripciones", 403, null, "PERMISSION_DENIED");
  }

  return withTransaction(async (client) => {
    const result = await client.query(
      `
      INSERT INTO "Suscripcion" (
        id_empresa,
        id_plan,
        id_licencia,
        estado,
        ciclo,
        monto,
        moneda,
        fecha_inicio,
        fecha_fin,
        proximo_cobro,
        observaciones
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8::date, CURRENT_DATE),$9,$10,$11)
      RETURNING *;
      `,
      [
        data.id_empresa,
        data.id_plan,
        data.id_licencia || null,
        data.estado || "ACTIVA",
        data.ciclo || "MENSUAL",
        data.monto ?? 0,
        data.moneda || "GTQ",
        data.fecha_inicio || null,
        data.fecha_fin || null,
        data.proximo_cobro || null,
        data.observaciones || null,
      ]
    );
    const suscripcion = result.rows[0];

    if (["ACTIVA", "PRUEBA"].includes(suscripcion.estado)) {
      await aplicarPlanAEmpresa(client, suscripcion.id_empresa, suscripcion.id_plan);
    }

    await registrarAuditoria({
      client,
      id_empresa: suscripcion.id_empresa,
      id_usuario: actor?.id_usuario || null,
      modulo: "suscripciones",
      tabla_afectada: "Suscripcion",
      id_registro: suscripcion.id_suscripcion,
      accion: "SUSCRIPCION_CREADA",
      descripcion: "Suscripcion SaaS creada",
      valores_nuevos: suscripcion,
    });

    return suscripcion;
  });
};

export const actualizarSuscripcionService = async (
  uuid_suscripcion,
  data,
  tenant,
  actor = null
) => {
  if (!tenant?.isSuperAdmin) {
    throw new AppError("Solo superadmin puede editar suscripciones", 403, null, "PERMISSION_DENIED");
  }

  return withTransaction(async (client) => {
    const result = await client.query(
      `
      UPDATE "Suscripcion"
      SET id_plan = COALESCE($1, id_plan),
          id_licencia = COALESCE($2, id_licencia),
          estado = COALESCE($3, estado),
          ciclo = COALESCE($4, ciclo),
          monto = COALESCE($5, monto),
          moneda = COALESCE($6, moneda),
          fecha_inicio = COALESCE($7::date, fecha_inicio),
          fecha_fin = $8,
          proximo_cobro = $9,
          observaciones = COALESCE($10, observaciones),
          updated_at = NOW()
      WHERE uuid_suscripcion = $11
      AND deleted_at IS NULL
      RETURNING *;
      `,
      [
        data.id_plan ?? null,
        data.id_licencia ?? null,
        data.estado ?? null,
        data.ciclo ?? null,
        data.monto ?? null,
        data.moneda ?? null,
        data.fecha_inicio || null,
        data.fecha_fin ?? null,
        data.proximo_cobro ?? null,
        data.observaciones ?? null,
        uuid_suscripcion,
      ]
    );
    const suscripcion = result.rows[0] || null;

    if (!suscripcion) {
      throw new AppError("Suscripcion no encontrada", 404, null, "SUBSCRIPTION_NOT_FOUND");
    }

    if (["ACTIVA", "PRUEBA"].includes(suscripcion.estado)) {
      await aplicarPlanAEmpresa(client, suscripcion.id_empresa, suscripcion.id_plan);
    }

    await registrarAuditoria({
      client,
      id_empresa: suscripcion.id_empresa,
      id_usuario: actor?.id_usuario || null,
      modulo: "suscripciones",
      tabla_afectada: "Suscripcion",
      id_registro: suscripcion.id_suscripcion,
      accion: "SUSCRIPCION_ACTUALIZADA",
      descripcion: "Suscripcion SaaS actualizada",
      valores_nuevos: suscripcion,
    });

    return suscripcion;
  });
};

export const cambiarEstadoSuscripcionService = async (
  uuid_suscripcion,
  estado,
  observaciones,
  tenant,
  actor = null
) => {
  if (!tenant?.isSuperAdmin) {
    throw new AppError("Solo superadmin puede editar suscripciones", 403, null, "PERMISSION_DENIED");
  }

  return withTransaction(async (client) => {
    const result = await client.query(
      `
      UPDATE "Suscripcion"
      SET estado = $1,
          observaciones = COALESCE($2, observaciones),
          updated_at = NOW()
      WHERE uuid_suscripcion = $3
      AND deleted_at IS NULL
      RETURNING *;
      `,
      [estado, observaciones || null, uuid_suscripcion]
    );
    const suscripcion = result.rows[0] || null;

    if (!suscripcion) {
      throw new AppError("Suscripcion no encontrada", 404, null, "SUBSCRIPTION_NOT_FOUND");
    }

    if (["ACTIVA", "PRUEBA"].includes(suscripcion.estado)) {
      await aplicarPlanAEmpresa(client, suscripcion.id_empresa, suscripcion.id_plan);
    }

    await registrarAuditoria({
      client,
      id_empresa: suscripcion.id_empresa,
      id_usuario: actor?.id_usuario || null,
      modulo: "suscripciones",
      tabla_afectada: "Suscripcion",
      id_registro: suscripcion.id_suscripcion,
      accion: "SUSCRIPCION_ESTADO_CAMBIADO",
      descripcion: `Estado de suscripcion cambiado a ${estado}`,
      valores_nuevos: suscripcion,
    });

    return suscripcion;
  });
};
