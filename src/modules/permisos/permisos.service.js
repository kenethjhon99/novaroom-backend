import { listarPermisos } from "./permisos.model.js";

export const listarPermisosService = async (actor = null) => {
  return listarPermisos({
    isSuperAdmin: actor?.tipo_usuario === "SUPER_ADMIN",
  });
};
