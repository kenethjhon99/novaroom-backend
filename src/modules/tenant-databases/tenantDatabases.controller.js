import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import {
  actualizarTenantDatabaseService,
  crearTenantDatabaseService,
  listarTenantDatabasesService,
  obtenerTenantDatabaseService,
  registrarHealthTenantDatabaseService,
} from "./tenantDatabases.service.js";

export const listarTenantDatabasesController = asyncHandler(async (req, res) => {
  const tenantDatabases = await listarTenantDatabasesService(req.tenant);
  return successResponse(res, "BD dedicadas obtenidas correctamente", tenantDatabases);
});

export const obtenerTenantDatabaseController = asyncHandler(async (req, res) => {
  const tenantDatabase = await obtenerTenantDatabaseService(req.params.uuid, req.tenant);
  return successResponse(res, "BD dedicada obtenida correctamente", tenantDatabase);
});

export const crearTenantDatabaseController = asyncHandler(async (req, res) => {
  const tenantDatabase = await crearTenantDatabaseService(
    req.body,
    req.tenant,
    req.user
  );
  return successResponse(res, "BD dedicada registrada correctamente", tenantDatabase, 201);
});

export const actualizarTenantDatabaseController = asyncHandler(async (req, res) => {
  const tenantDatabase = await actualizarTenantDatabaseService(
    req.params.uuid,
    req.body,
    req.tenant,
    req.user
  );
  return successResponse(res, "BD dedicada actualizada correctamente", tenantDatabase);
});

export const registrarHealthTenantDatabaseController = asyncHandler(async (req, res) => {
  const tenantDatabase = await registrarHealthTenantDatabaseService(
    req.params.uuid,
    req.body,
    req.tenant,
    req.user
  );
  return successResponse(res, "Health check registrado correctamente", tenantDatabase);
});
