import { successResponse } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  actualizarUsuarioService,
  cambiarEstadoUsuarioService,
  cambiarPasswordUsuarioService,
  crearUsuarioService,
  listarUsuariosService,
  obtenerUsuarioService,
} from "./usuarios.service.js";

const getEmpresaScope = (req) => {
  if (req.user?.tipo_usuario === "SUPER_ADMIN" && !req.tenant.id_empresa) {
    throw new AppError(
      "Selecciona una empresa para administrar usuarios",
      400,
      null,
      "TENANT_COMPANY_REQUIRED"
    );
  }

  return req.tenant.id_empresa;
};

export const listarUsuariosController = asyncHandler(async (req, res) => {
  const usuarios = await listarUsuariosService(getEmpresaScope(req));
  return successResponse(res, "Usuarios obtenidos correctamente", usuarios);
});

export const obtenerUsuarioController = asyncHandler(async (req, res) => {
  const usuario = await obtenerUsuarioService(req.params.uuid, getEmpresaScope(req));
  return successResponse(res, "Usuario obtenido correctamente", usuario);
});

export const crearUsuarioController = asyncHandler(async (req, res) => {
  const usuario = await crearUsuarioService(getEmpresaScope(req), req.body, req.user);
  return successResponse(res, "Usuario creado correctamente", usuario, 201);
});

export const actualizarUsuarioController = asyncHandler(async (req, res) => {
  const usuario = await actualizarUsuarioService(
    req.params.uuid,
    getEmpresaScope(req),
    req.body,
    req.user
  );

  return successResponse(res, "Usuario actualizado correctamente", usuario);
});

export const cambiarEstadoUsuarioController = asyncHandler(async (req, res) => {
  const usuario = await cambiarEstadoUsuarioService(
    req.params.uuid,
    getEmpresaScope(req),
    req.body.estado,
    req.user
  );

  return successResponse(res, "Estado de usuario actualizado", usuario);
});

export const cambiarPasswordUsuarioController = asyncHandler(async (req, res) => {
  const usuario = await cambiarPasswordUsuarioService(
    req.params.uuid,
    getEmpresaScope(req),
    req.body.password
  );

  return successResponse(res, "Contrasena actualizada correctamente", usuario);
});
