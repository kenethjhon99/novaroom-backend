import bcrypt from "bcryptjs";

import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { registrarAuditoria } from "../../utils/audit.js";

import {
  listarEmpresas,
  obtenerEmpresaPorId,
  obtenerEmpresaPorUuid,
  obtenerPlanPorId,
  crearEmpresa,
  crearSucursalPrincipal,
  crearLicencia,
  crearLimitesEmpresa,
  activarModulosDelPlan,
  crearConfiguracionEmpresa,
  crearConfiguracionSucursal,
  crearRolDueno,
  asignarPermisosRolDueno,
  crearUsuarioAdmin,
  asignarRolUsuario,
  crearAreaDefault,
  crearNivelDefault,
} from "./empresas.model.js";

export const listarEmpresasService = async (tenant) => {
  if (!tenant?.isSuperAdmin) {
    const empresa = await obtenerEmpresaPorId(tenant?.id_empresa);
    return empresa ? [empresa] : [];
  }

  return listarEmpresas();
};

export const obtenerEmpresaService = async (uuid_empresa, tenant) => {
  const empresa = await obtenerEmpresaPorUuid(uuid_empresa);

  if (!empresa) {
    throw new AppError("Empresa no encontrada", 404);
  }

  if (!tenant?.isSuperAdmin && Number(empresa.id_empresa) !== Number(tenant?.id_empresa)) {
    throw new AppError("No tienes acceso a esta empresa", 403, null, "TENANT_FORBIDDEN");
  }

  return empresa;
};

export const crearEmpresaCompletaService = async (data, user) => {
  if (user?.tipo_usuario !== "SUPER_ADMIN") {
    throw new AppError("Solo un superadmin puede crear empresas", 403, null, "PERMISSION_DENIED");
  }

  return withTransaction(async (client) => {
    const plan = await obtenerPlanPorId(client, data.id_plan);

    if (!plan) {
      throw new AppError("Plan no válido", 400);
    }

    const empresa = await crearEmpresa(client, data);

    const sucursal = await crearSucursalPrincipal(
      client,
      empresa.id_empresa,
      data.sucursal
    );

    const licencia = await crearLicencia(client, empresa.id_empresa, data.id_plan);

    const limites = await crearLimitesEmpresa(
      client,
      empresa.id_empresa,
      plan
    );

    const modulos = await activarModulosDelPlan(
      client,
      empresa.id_empresa,
      data.id_plan,
      data.modulos_personalizados || []
    );

    await crearConfiguracionEmpresa(client, empresa.id_empresa);
    await crearConfiguracionSucursal(
      client,
      empresa.id_empresa,
      sucursal.id_sucursal
    );

    const area = await crearAreaDefault(
      client,
      empresa.id_empresa,
      sucursal.id_sucursal
    );

    const nivel = await crearNivelDefault(
      client,
      empresa.id_empresa,
      sucursal.id_sucursal,
      area.id_area
    );

    const password_hash = await bcrypt.hash(data.admin.password, 10);

    const rolDueno = await crearRolDueno(client, empresa.id_empresa);
    await asignarPermisosRolDueno(client, rolDueno.id_rol);

    const admin = await crearUsuarioAdmin(client, {
      id_empresa: empresa.id_empresa,
      id_sucursal: sucursal.id_sucursal,
      nombres: data.admin.nombres,
      apellidos: data.admin.apellidos,
      email: data.admin.email,
      telefono: data.admin.telefono,
      password_hash,
    });

    await asignarRolUsuario(
      client,
      admin.id_usuario,
      rolDueno.id_rol,
      empresa.id_empresa,
      sucursal.id_sucursal
    );

    await registrarAuditoria({
      client,
      id_empresa: empresa.id_empresa,
      id_sucursal: sucursal.id_sucursal,
      id_usuario: user?.id_usuario || null,
      modulo: "empresas",
      tabla_afectada: "Empresa",
      id_registro: empresa.id_empresa,
      accion: "EMPRESA_CREADA",
      descripcion: "Empresa creada con sucursal principal, licencia y usuario administrador",
      valores_nuevos: {
        empresa,
        sucursal,
        licencia,
        limites,
        modulos_activados: modulos.length,
        admin,
      },
    });

    return {
      empresa,
      sucursal,
      licencia,
      limites,
      modulos_activados: modulos.length,
      area,
      nivel,
      admin,
    };
  });
};
