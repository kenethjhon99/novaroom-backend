import { query } from "../config/db.js";

const pickRequestMeta = (meta = {}) => ({
  ip: meta.ip || meta.req?.ip || null,
  user_agent: meta.userAgent || meta.user_agent || meta.req?.headers?.["user-agent"] || null,
  dispositivo: meta.dispositivo || null,
});

export const registrarAuditoria = async ({
  client = null,
  id_empresa = null,
  id_sucursal = null,
  id_usuario = null,
  modulo,
  tabla_afectada = null,
  id_registro = null,
  accion,
  descripcion = null,
  valores_anteriores = null,
  valores_nuevos = null,
  meta = {},
}) => {
  const executor = client || { query };
  const requestMeta = pickRequestMeta(meta);

  await executor.query(
    `
    INSERT INTO "Auditoria" (
      id_empresa,
      id_sucursal,
      id_usuario,
      modulo,
      tabla_afectada,
      id_registro,
      accion,
      descripcion,
      valores_anteriores,
      valores_nuevos,
      ip,
      user_agent,
      dispositivo
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13);
    `,
    [
      id_empresa,
      id_sucursal,
      id_usuario,
      modulo,
      tabla_afectada,
      id_registro,
      accion,
      descripcion,
      valores_anteriores ? JSON.stringify(valores_anteriores) : null,
      valores_nuevos ? JSON.stringify(valores_nuevos) : null,
      requestMeta.ip,
      requestMeta.user_agent,
      requestMeta.dispositivo,
    ]
  );
};

export const auditFromUser = (user, overrides = {}) => ({
  id_empresa: overrides.id_empresa ?? user?.id_empresa ?? null,
  id_sucursal: overrides.id_sucursal ?? user?.id_sucursal ?? null,
  id_usuario: overrides.id_usuario ?? user?.id_usuario ?? null,
});
