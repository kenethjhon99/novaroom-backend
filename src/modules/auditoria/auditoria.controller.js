import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import { listarAuditoria } from "./auditoria.model.js";

export const listarAuditoriaController = asyncHandler(async (req, res) => {
  const auditoria = await listarAuditoria(req.tenant, req.query);
  return successResponse(res, "Auditoria obtenida correctamente", auditoria);
});
