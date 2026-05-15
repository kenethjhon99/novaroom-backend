import { AppError } from "../../utils/AppError.js";
import { query } from "../../config/db.js";
import { assertPlanLimit } from "../../utils/planLimits.js";
import { registrarAuditoria } from "../../utils/audit.js";
import {
  actualizarModuloEmpresa,
  listarModulos,
  listarModulosEmpresa,
  obtenerModuloEmpresa,
} from "./modulos.model.js";

export const listarModulosService = async () => {
  return listarModulos();
};

export const listarModulosEmpresaService = async (id_empresa) => {
  if (!id_empresa) {
    throw new AppError("Empresa no identificada", 400, null, "TENANT_REQUIRED");
  }

  return listarModulosEmpresa(id_empresa);
};

export const actualizarModuloEmpresaService = async (
  id_empresa,
  id_modulo,
  data,
  actor = null
) => {
  if (!id_empresa) {
    throw new AppError("Empresa no identificada", 400, null, "TENANT_REQUIRED");
  }

  const modulo = await obtenerModuloEmpresa(id_empresa, id_modulo);

  if (!modulo || !modulo.modulo_activo) {
    throw new AppError("Modulo no encontrado o inactivo", 404, null, "MODULE_NOT_FOUND");
  }

  if (data.activo && !modulo.activo) {
    await assertPlanLimit({
      client: { query },
      id_empresa,
      limitKey: "max_modulos",
      countQuery: `
        SELECT COUNT(*)::int AS total
        FROM "Empresa_modulo"
        WHERE id_empresa = $1
        AND activo = true;
      `,
      countParams: [id_empresa],
    });
  }

  const result = await actualizarModuloEmpresa(id_empresa, id_modulo, data);

  await registrarAuditoria({
    id_empresa,
    id_usuario: actor?.id_usuario || null,
    modulo: "modulos",
    tabla_afectada: "Empresa_modulo",
    id_registro: result.id_empresa_modulo,
    accion: data.activo ? "MODULO_ACTIVADO" : "MODULO_DESACTIVADO",
    descripcion: `Modulo ${data.activo ? "activado" : "desactivado"} para empresa`,
    valores_anteriores: modulo,
    valores_nuevos: result,
  });

  return result;
};
