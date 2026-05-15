import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.js";

import {
  listarCategoriasService,
  crearCategoriaService,
  listarProductosService,
  crearProductoService,
  listarBodegasService,
  crearBodegaService,
  listarInventarioService,
  agregarStockService,
} from "./inventario.service.js";

export const listarCategoriasController = asyncHandler(async (req, res) => {
  const categorias = await listarCategoriasService(req.tenant.id_empresa);
  return successResponse(res, "Categorías obtenidas", categorias);
});

export const crearCategoriaController = asyncHandler(async (req, res) => {
  const categoria = await crearCategoriaService(req.tenant.id_empresa, req.body);
  return successResponse(res, "Categoría creada", categoria, 201);
});

export const listarProductosController = asyncHandler(async (req, res) => {
  const productos = await listarProductosService(req.tenant.id_empresa);
  return successResponse(res, "Productos obtenidos", productos);
});

export const crearProductoController = asyncHandler(async (req, res) => {
  const producto = await crearProductoService(req.tenant.id_empresa, req.body);
  return successResponse(res, "Producto creado", producto, 201);
});

export const listarBodegasController = asyncHandler(async (req, res) => {
  const bodegas = await listarBodegasService(
    req.tenant.id_empresa,
    req.query.id_sucursal || req.tenant.id_sucursal
  );

  return successResponse(res, "Bodegas obtenidas", bodegas);
});

export const crearBodegaController = asyncHandler(async (req, res) => {
  const bodega = await crearBodegaService(req.tenant.id_empresa, req.body);
  return successResponse(res, "Bodega creada", bodega, 201);
});

export const listarInventarioController = asyncHandler(async (req, res) => {
  const inventario = await listarInventarioService(req.tenant.id_empresa, {
    id_sucursal: req.query.id_sucursal || req.tenant.id_sucursal,
    id_bodega: req.query.id_bodega,
  });

  return successResponse(res, "Inventario obtenido", inventario);
});

export const agregarStockController = asyncHandler(async (req, res) => {
  const result = await agregarStockService(
    req.tenant.id_empresa,
    req.body,
    req.user
  );

  return successResponse(res, "Stock agregado correctamente", result, 201);
});
