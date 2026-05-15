import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { registrarAuditoria } from "../../utils/audit.js";
import { assertPlanFeature } from "../../utils/planLimits.js";
import {
  actualizarTenantDatabase,
  crearTenantDatabase,
  listarTenantDatabases,
  obtenerTenantDatabasePorUuid,
} from "./tenantDatabases.model.js";

export const listarTenantDatabasesService = async (tenant) => {
  return listarTenantDatabases(tenant);
};

export const obtenerTenantDatabaseService = async (uuid_tenant_database, tenant) => {
  const tenantDatabase = await obtenerTenantDatabasePorUuid(
    uuid_tenant_database,
    tenant
  );

  if (!tenantDatabase) {
    throw new AppError("BD dedicada no encontrada", 404, null, "TENANT_DB_NOT_FOUND");
  }

  return tenantDatabase;
};

export const crearTenantDatabaseService = async (data, tenant, actor = null) => {
  if (!tenant?.isSuperAdmin) {
    throw new AppError("Solo superadmin puede registrar BD dedicada", 403, null, "PERMISSION_DENIED");
  }

  return withTransaction(async (client) => {
    await assertPlanFeature({
      client,
      id_empresa: data.id_empresa,
      featureKey: "permite_bd_exclusiva",
      message: "El plan de la empresa no permite BD exclusiva",
    });

    const tenantDatabase = await crearTenantDatabase(
      client,
      data,
      actor?.id_usuario
    );

    await registrarAuditoria({
      client,
      id_empresa: tenantDatabase.id_empresa,
      id_usuario: actor?.id_usuario || null,
      modulo: "tenant_database",
      tabla_afectada: "Tenant_database",
      id_registro: tenantDatabase.id_tenant_database,
      accion: "TENANT_DATABASE_CREADA",
      descripcion: "BD dedicada registrada para cliente enterprise",
      valores_nuevos: tenantDatabase,
    });

    return tenantDatabase;
  });
};

export const actualizarTenantDatabaseService = async (
  uuid_tenant_database,
  data,
  tenant,
  actor = null
) => {
  if (!tenant?.isSuperAdmin) {
    throw new AppError("Solo superadmin puede editar BD dedicada", 403, null, "PERMISSION_DENIED");
  }

  const anterior = await obtenerTenantDatabasePorUuid(uuid_tenant_database, tenant);

  if (!anterior) {
    throw new AppError("BD dedicada no encontrada", 404, null, "TENANT_DB_NOT_FOUND");
  }

  const tenantDatabase = await actualizarTenantDatabase(uuid_tenant_database, data);

  await registrarAuditoria({
    id_empresa: tenantDatabase.id_empresa,
    id_usuario: actor?.id_usuario || null,
    modulo: "tenant_database",
    tabla_afectada: "Tenant_database",
    id_registro: tenantDatabase.id_tenant_database,
    accion: "TENANT_DATABASE_ACTUALIZADA",
    descripcion: "BD dedicada actualizada",
    valores_anteriores: anterior,
    valores_nuevos: tenantDatabase,
  });

  return tenantDatabase;
};

export const registrarHealthTenantDatabaseService = async (
  uuid_tenant_database,
  data,
  tenant,
  actor = null
) => {
  return actualizarTenantDatabaseService(
    uuid_tenant_database,
    {
      health_status: data.health_status,
      notas: data.notas,
    },
    tenant,
    actor
  );
};
