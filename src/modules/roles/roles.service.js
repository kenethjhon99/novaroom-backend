import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { assertPlanLimit } from "../../utils/planLimits.js";
import { registrarAuditoria } from "../../utils/audit.js";
import {
  actualizarRol,
  cambiarEstadoRol,
  crearRol,
  listarRoles,
  obtenerRolPorUuid,
  reemplazarPermisosRol,
  validarPermisosAsignables,
} from "./roles.model.js";

const roleScopeFromRequest = (tenant, actor) => ({
  id_empresa: tenant?.id_empresa || null,
  includeGlobal: actor?.tipo_usuario === "SUPER_ADMIN" && !tenant?.id_empresa,
});

export const listarRolesService = async (tenant, actor) => {
  return listarRoles(roleScopeFromRequest(tenant, actor));
};

export const obtenerRolService = async (uuid_rol, tenant, actor) => {
  const rol = await obtenerRolPorUuid(uuid_rol, roleScopeFromRequest(tenant, actor));

  if (!rol) {
    throw new AppError("Rol no encontrado", 404, null, "ROLE_NOT_FOUND");
  }

  return rol;
};

export const crearRolService = async (id_empresa, data, actor = null) => {
  return withTransaction(async (client) => {
    await assertPlanLimit({
      client,
      id_empresa,
      id_usuario: actor?.id_usuario || null,
      limitKey: "max_roles",
      countQuery: `
        SELECT COUNT(*)::int AS total
        FROM "Rol"
        WHERE id_empresa = $1
        AND deleted_at IS NULL
        AND estado = 'ACTIVO'
        AND es_sistema = false;
      `,
      countParams: [id_empresa],
    });

    const permisosValidos = await validarPermisosAsignables(client, data.permisos, {
      isSuperAdmin: actor?.tipo_usuario === "SUPER_ADMIN",
    });

    if (!permisosValidos) {
      throw new AppError("Uno o mas permisos no son validos", 400, null, "PERMISSION_INVALID");
    }

    const rol = await crearRol(client, id_empresa, data);
    await reemplazarPermisosRol(client, rol.id_rol, data.permisos);

    await registrarAuditoria({
      client,
      id_empresa,
      modulo: "roles",
      tabla_afectada: "Rol",
      id_registro: rol.id_rol,
      accion: "ROL_CREADO",
      descripcion: "Rol creado",
      valores_nuevos: { ...rol, permisos: data.permisos },
    });

    return rol;
  });
};

export const actualizarRolService = async (uuid_rol, id_empresa, data, actor = null) => {
  return withTransaction(async (client) => {
    if (data.permisos) {
      const permisosValidos = await validarPermisosAsignables(client, data.permisos, {
        isSuperAdmin: actor?.tipo_usuario === "SUPER_ADMIN",
      });

      if (!permisosValidos) {
        throw new AppError("Uno o mas permisos no son validos", 400, null, "PERMISSION_INVALID");
      }
    }

    const rol = await actualizarRol(client, uuid_rol, id_empresa, data);

    if (!rol) {
      throw new AppError("Rol no encontrado o protegido", 404, null, "ROLE_NOT_FOUND");
    }

    if (data.permisos) {
      await reemplazarPermisosRol(client, rol.id_rol, data.permisos);
    }

    await registrarAuditoria({
      client,
      id_empresa,
      id_usuario: actor?.id_usuario || null,
      modulo: "roles",
      tabla_afectada: "Rol",
      id_registro: rol.id_rol,
      accion: "ROL_ACTUALIZADO",
      descripcion: "Rol actualizado",
      valores_nuevos: { ...rol, permisos: data.permisos },
    });

    return rol;
  });
};

export const cambiarEstadoRolService = async (uuid_rol, id_empresa, estado, actor = null) => {
  const rol = await cambiarEstadoRol(uuid_rol, id_empresa, estado);

  if (!rol) {
    throw new AppError("Rol no encontrado o protegido", 404, null, "ROLE_NOT_FOUND");
  }

  await registrarAuditoria({
    id_empresa,
    id_usuario: actor?.id_usuario || null,
    modulo: "roles",
    tabla_afectada: "Rol",
    id_registro: rol.id_rol,
    accion: "ROL_ESTADO_CAMBIADO",
    descripcion: `Estado de rol cambiado a ${estado}`,
    valores_nuevos: rol,
  });

  return rol;
};
