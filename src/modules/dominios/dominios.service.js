import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { registrarAuditoria } from "../../utils/audit.js";
import { assertPlanFeature } from "../../utils/planLimits.js";
import { resolveTxt } from "dns/promises";
import {
  actualizarDominio,
  crearDominio,
  eliminarDominio,
  listarDominios,
  obtenerDominioPorUuid,
} from "./dominios.model.js";

export const listarDominiosService = async (id_empresa) => {
  return listarDominios(id_empresa);
};

export const crearDominioService = async (id_empresa, data, actor = null) => {
  return withTransaction(async (client) => {
    await assertPlanFeature({
      client,
      id_empresa,
      featureKey: "permite_dominio_propio",
      message: "El plan de la empresa no permite dominio propio",
    });

    const dominio = await crearDominio(client, id_empresa, data);

    await registrarAuditoria({
      client,
      id_empresa,
      id_usuario: actor?.id_usuario || null,
      modulo: "dominios",
      tabla_afectada: "Empresa_dominio",
      id_registro: dominio.id_empresa_dominio,
      accion: "DOMINIO_CREADO",
      descripcion: "Dominio personalizado registrado",
      valores_nuevos: dominio,
    });

    return dominio;
  });
};

export const actualizarDominioService = async (
  uuid_empresa_dominio,
  id_empresa,
  data,
  actor = null
) => {
  const anterior = await obtenerDominioPorUuid(uuid_empresa_dominio, id_empresa);

  if (!anterior) {
    throw new AppError("Dominio no encontrado", 404, null, "DOMAIN_NOT_FOUND");
  }

  if (data.estado === "ACTIVO" && !["VERIFICADO", "ACTIVO"].includes(anterior.estado)) {
    throw new AppError(
      "Verifica el DNS del dominio antes de activarlo",
      409,
      { dominio: anterior.dominio, dns_host: anterior.dns_host, dns_valor: anterior.dns_valor },
      "DOMAIN_NOT_VERIFIED"
    );
  }

  const dominio = await actualizarDominio(uuid_empresa_dominio, id_empresa, data);

  await registrarAuditoria({
    id_empresa,
    id_usuario: actor?.id_usuario || null,
    modulo: "dominios",
    tabla_afectada: "Empresa_dominio",
    id_registro: dominio.id_empresa_dominio,
    accion: "DOMINIO_ACTUALIZADO",
    descripcion: "Dominio personalizado actualizado",
    valores_anteriores: anterior,
    valores_nuevos: dominio,
  });

  return dominio;
};

export const verificarDominioService = async (
  uuid_empresa_dominio,
  id_empresa,
  actor = null
) => {
  const dominio = await obtenerDominioPorUuid(uuid_empresa_dominio, id_empresa);

  if (!dominio) {
    throw new AppError("Dominio no encontrado", 404, null, "DOMAIN_NOT_FOUND");
  }

  try {
    const records = await resolveTxt(dominio.dns_host);
    const values = records.flat().map((value) => value.trim());

    if (!values.includes(dominio.verificacion_token)) {
      throw new AppError(
        "El TXT de verificacion no coincide",
        409,
        {
          dns_host: dominio.dns_host,
          expected: dominio.verificacion_token,
          received: values,
        },
        "DOMAIN_VERIFICATION_FAILED"
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "No se pudo verificar el TXT del dominio",
      409,
      {
        dns_host: dominio.dns_host,
        expected: dominio.verificacion_token,
      },
      "DOMAIN_DNS_NOT_FOUND"
    );
  }

  return actualizarDominioService(
    uuid_empresa_dominio,
    id_empresa,
    { estado: "VERIFICADO" },
    actor
  );
};

export const eliminarDominioService = async (
  uuid_empresa_dominio,
  id_empresa,
  actor = null
) => {
  const dominio = await eliminarDominio(uuid_empresa_dominio, id_empresa);

  if (!dominio) {
    throw new AppError("Dominio no encontrado", 404, null, "DOMAIN_NOT_FOUND");
  }

  await registrarAuditoria({
    id_empresa,
    id_usuario: actor?.id_usuario || null,
    modulo: "dominios",
    tabla_afectada: "Empresa_dominio",
    id_registro: dominio.id_empresa_dominio,
    accion: "DOMINIO_ELIMINADO",
    descripcion: "Dominio personalizado eliminado",
    valores_nuevos: dominio,
  });

  return dominio;
};
