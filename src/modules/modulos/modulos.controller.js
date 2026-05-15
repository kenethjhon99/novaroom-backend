import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  actualizarModuloEmpresaService,
  listarModulosEmpresaService,
  listarModulosService,
} from "./modulos.service.js";

export const listarModulosController = asyncHandler(async (req, res) => {
  const modulos = await listarModulosService();
  return successResponse(res, "Modulos obtenidos correctamente", modulos);
});

export const listarModulosEmpresaController = asyncHandler(async (req, res) => {
  const id_empresa = req.tenant.isSuperAdmin
    ? Number(req.query.id_empresa || req.tenant.id_empresa)
    : req.tenant.id_empresa;

  const modulos = await listarModulosEmpresaService(id_empresa);
  return successResponse(res, "Modulos de empresa obtenidos correctamente", modulos);
});

export const actualizarModuloEmpresaController = asyncHandler(async (req, res) => {
  const id_empresa = req.tenant.isSuperAdmin
    ? Number(req.query.id_empresa || req.tenant.id_empresa)
    : req.tenant.id_empresa;

  const modulo = await actualizarModuloEmpresaService(
    id_empresa,
    Number(req.params.idModulo),
    req.body,
    req.user
  );

  return successResponse(res, "Modulo de empresa actualizado correctamente", modulo);
});
