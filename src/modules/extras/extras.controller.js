import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";

import {
  venderExtraService,
  listarExtrasOcupacionService,
} from "./extras.service.js";

export const venderExtraController = asyncHandler(async (req, res) => {
  const result = await venderExtraService(
    req.tenant.id_empresa,
    req.body,
    req.user
  );

  return successResponse(res, "Extra vendido correctamente", result, 201);
});

export const listarExtrasOcupacionController = asyncHandler(async (req, res) => {
  const extras = await listarExtrasOcupacionService(
    req.tenant.id_empresa,
    req.params.uuidOcupacion
  );

  return successResponse(res, "Extras de ocupación obtenidos", extras);
});