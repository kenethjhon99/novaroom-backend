import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { meService } from "../auth/auth.service.js";

export const contextoController = asyncHandler(async (req, res) => {
  const context = await meService(req.user, req.token);

  return successResponse(res, "Contexto operativo obtenido", {
    tenant: req.tenant,
    ...context,
  });
});

export const cambiarSucursalActivaController = asyncHandler(async (req, res) => {
  const context = await meService(req.user, req.token);
  const id_sucursal = Number(req.body.id_sucursal);
  const sucursal = context.sucursales.find(
    (item) => Number(item.id_sucursal) === id_sucursal
  );

  if (!sucursal) {
    return res.status(403).json({
      success: false,
      message: "No tienes acceso a esta sucursal",
      data: null,
      error: {
        code: "TENANT_BRANCH_FORBIDDEN",
        details: { id_sucursal },
      },
    });
  }

  return successResponse(res, "Sucursal activa validada", {
    id_sucursal: sucursal.id_sucursal,
    uuid_sucursal: sucursal.uuid_sucursal,
    nombre: sucursal.nombre,
  });
});
