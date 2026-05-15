import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { registrarAuditoria } from "../../utils/audit.js";
import {
  actualizarPlan,
  cambiarEstadoPlan,
  crearPlan,
  listarPlanes,
  obtenerPlanPorUuid,
  reemplazarModulosPlan,
  validarModulos,
} from "./planes.model.js";

export const listarPlanesService = async () => listarPlanes();

export const crearPlanService = async (data, actor = null) => {
  return withTransaction(async (client) => {
    const modulosValidos = await validarModulos(client, data.modulos);

    if (!modulosValidos) {
      throw new AppError("Uno o mas modulos no son validos", 400, null, "MODULE_INVALID");
    }

    const plan = await crearPlan(client, data);
    await reemplazarModulosPlan(client, plan.id_plan, data.modulos);

    await registrarAuditoria({
      client,
      id_usuario: actor?.id_usuario || null,
      modulo: "planes",
      tabla_afectada: "Plan",
      id_registro: plan.id_plan,
      accion: "PLAN_CREADO",
      descripcion: "Plan SaaS creado",
      valores_nuevos: { ...plan, modulos: data.modulos },
    });

    return plan;
  });
};

export const actualizarPlanService = async (uuid_plan, data, actor = null) => {
  return withTransaction(async (client) => {
    if (data.modulos) {
      const modulosValidos = await validarModulos(client, data.modulos);

      if (!modulosValidos) {
        throw new AppError("Uno o mas modulos no son validos", 400, null, "MODULE_INVALID");
      }
    }

    const plan = await actualizarPlan(client, uuid_plan, data);

    if (!plan) {
      throw new AppError("Plan no encontrado", 404, null, "PLAN_NOT_FOUND");
    }

    if (data.modulos) {
      await reemplazarModulosPlan(client, plan.id_plan, data.modulos);
    }

    await registrarAuditoria({
      client,
      id_usuario: actor?.id_usuario || null,
      modulo: "planes",
      tabla_afectada: "Plan",
      id_registro: plan.id_plan,
      accion: "PLAN_ACTUALIZADO",
      descripcion: "Plan SaaS actualizado",
      valores_nuevos: { ...plan, modulos: data.modulos },
    });

    return plan;
  });
};

export const cambiarEstadoPlanService = async (uuid_plan, activo, actor = null) => {
  const plan = await cambiarEstadoPlan(uuid_plan, activo);

  if (!plan) {
    throw new AppError("Plan no encontrado", 404, null, "PLAN_NOT_FOUND");
  }

  await registrarAuditoria({
    modulo: "planes",
    id_usuario: actor?.id_usuario || null,
    tabla_afectada: "Plan",
    id_registro: plan.id_plan,
    accion: activo ? "PLAN_ACTIVADO" : "PLAN_DESACTIVADO",
    descripcion: "Estado de plan SaaS actualizado",
    valores_nuevos: plan,
  });

  return plan;
};

export const obtenerPlanService = async (uuid_plan) => {
  const plan = await obtenerPlanPorUuid(uuid_plan);

  if (!plan) {
    throw new AppError("Plan no encontrado", 404, null, "PLAN_NOT_FOUND");
  }

  return plan;
};
