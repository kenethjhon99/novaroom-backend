import bcrypt from "bcryptjs";

import { withTransaction } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { assertPlanLimit } from "../../utils/planLimits.js";
import { registrarAuditoria } from "../../utils/audit.js";
import {
  actualizarUsuario,
  cambiarEstadoUsuario,
  cambiarPasswordUsuario,
  crearUsuario,
  listarUsuarios,
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorUuid,
  reemplazarRolesUsuario,
  validarRolesEmpresa,
  validarSucursalEmpresa,
} from "./usuarios.model.js";

export const listarUsuariosService = async (id_empresa) => {
  return listarUsuarios(id_empresa);
};

export const obtenerUsuarioService = async (uuid_usuario, id_empresa) => {
  const usuario = await obtenerUsuarioPorUuid(uuid_usuario, id_empresa);

  if (!usuario) {
    throw new AppError("Usuario no encontrado", 404, null, "USER_NOT_FOUND");
  }

  return usuario;
};

export const crearUsuarioService = async (id_empresa, data, actor = null) => {
  return withTransaction(async (client) => {
    await assertPlanLimit({
      client,
      id_empresa,
      limitKey: "max_usuarios",
      countQuery: `
        SELECT COUNT(*)::int AS total
        FROM "Usuario"
        WHERE id_empresa = $1
        AND deleted_at IS NULL
        AND estado <> 'INACTIVO';
      `,
      countParams: [id_empresa],
    });

    const sucursalValida = await validarSucursalEmpresa(
      client,
      data.id_sucursal,
      id_empresa
    );

    if (!sucursalValida) {
      throw new AppError("Sucursal no valida", 400, null, "TENANT_BRANCH_FORBIDDEN");
    }

    const rolesValidos = await validarRolesEmpresa(client, data.roles, id_empresa);

    if (!rolesValidos) {
      throw new AppError("Uno o mas roles no son validos", 400, null, "ROLE_INVALID");
    }

    const emailExistente = await obtenerUsuarioPorEmail(data.email);

    if (emailExistente) {
      throw new AppError("Ya existe un usuario con este email", 409, null, "USER_EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const usuario = await crearUsuario(client, id_empresa, data, passwordHash);

    await reemplazarRolesUsuario(
      client,
      usuario.id_usuario,
      id_empresa,
      usuario.id_sucursal,
      data.roles
    );

    await registrarAuditoria({
      client,
      id_empresa,
      id_sucursal: usuario.id_sucursal,
      id_usuario: actor?.id_usuario || null,
      modulo: "usuarios",
      tabla_afectada: "Usuario",
      id_registro: usuario.id_usuario,
      accion: "USUARIO_CREADO",
      descripcion: "Usuario creado",
      valores_nuevos: { ...usuario, roles: data.roles },
    });

    return usuario;
  });
};

export const actualizarUsuarioService = async (uuid_usuario, id_empresa, data, actor = null) => {
  return withTransaction(async (client) => {
    const existente = await obtenerUsuarioPorUuid(uuid_usuario, id_empresa);

    if (!existente) {
      throw new AppError("Usuario no encontrado", 404, null, "USER_NOT_FOUND");
    }

    const sucursalValida = await validarSucursalEmpresa(
      client,
      data.id_sucursal,
      id_empresa
    );

    if (!sucursalValida) {
      throw new AppError("Sucursal no valida", 400, null, "TENANT_BRANCH_FORBIDDEN");
    }

    if (data.roles) {
      const rolesValidos = await validarRolesEmpresa(client, data.roles, id_empresa);

      if (!rolesValidos) {
        throw new AppError("Uno o mas roles no son validos", 400, null, "ROLE_INVALID");
      }
    }

    const usuario = await actualizarUsuario(client, uuid_usuario, id_empresa, data);

    if (data.roles) {
      await reemplazarRolesUsuario(
        client,
        usuario.id_usuario,
        id_empresa,
        usuario.id_sucursal,
        data.roles
      );
    }

    await registrarAuditoria({
      client,
      id_empresa,
      id_sucursal: usuario.id_sucursal,
      id_usuario: actor?.id_usuario || null,
      modulo: "usuarios",
      tabla_afectada: "Usuario",
      id_registro: usuario.id_usuario,
      accion: "USUARIO_ACTUALIZADO",
      descripcion: "Usuario actualizado",
      valores_anteriores: existente,
      valores_nuevos: { ...usuario, roles: data.roles },
    });

    return usuario;
  });
};

export const cambiarEstadoUsuarioService = async (uuid_usuario, id_empresa, estado, actor = null) => {
  const usuario = await cambiarEstadoUsuario(uuid_usuario, id_empresa, estado);

  if (!usuario) {
    throw new AppError("Usuario no encontrado", 404, null, "USER_NOT_FOUND");
  }

  await registrarAuditoria({
    id_empresa,
    id_usuario: actor?.id_usuario || null,
    modulo: "usuarios",
    tabla_afectada: "Usuario",
    id_registro: usuario.id_usuario,
    accion: "USUARIO_ESTADO_CAMBIADO",
    descripcion: `Estado de usuario cambiado a ${estado}`,
    valores_nuevos: usuario,
  });

  return usuario;
};

export const cambiarPasswordUsuarioService = async (
  uuid_usuario,
  id_empresa,
  password
) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await cambiarPasswordUsuario(uuid_usuario, id_empresa, passwordHash);

  if (!usuario) {
    throw new AppError("Usuario no encontrado", 404, null, "USER_NOT_FOUND");
  }

  return usuario;
};
