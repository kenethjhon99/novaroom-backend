import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { listarPermisosService } from "./permisos.service.js";

export const listarPermisosController = asyncHandler(async (req, res) => {
  const permisos = await listarPermisosService(req.user);
  return successResponse(res, "Permisos obtenidos correctamente", permisos);
});
