-- Security administration modules and permissions.
-- These permissions back the /usuarios, /roles, /permisos and /modulos APIs.

INSERT INTO "Modulo" (nombre, clave, descripcion, es_premium, activo)
VALUES
  ('Usuarios', 'usuarios', 'Gestion de usuarios de empresa', false, true),
  ('Roles', 'roles', 'Gestion de roles de empresa', false, true),
  ('Permisos', 'permisos', 'Consulta de permisos del sistema', false, true),
  ('Modulos', 'modulos', 'Gestion de modulos activos por empresa', false, true)
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  activo = true,
  updated_at = NOW();

INSERT INTO "Permiso" (id_modulo, clave, modulo, accion, descripcion, activo)
SELECT m.id_modulo, p.clave, p.modulo, p.accion, p.descripcion, true
FROM (
  VALUES
    ('usuarios', 'usuarios.ver', 'usuarios', 'ver', 'Ver usuarios'),
    ('usuarios', 'usuarios.crear', 'usuarios', 'crear', 'Crear usuarios'),
    ('usuarios', 'usuarios.editar', 'usuarios', 'editar', 'Editar usuarios'),
    ('roles', 'roles.ver', 'roles', 'ver', 'Ver roles'),
    ('roles', 'roles.crear', 'roles', 'crear', 'Crear roles'),
    ('roles', 'roles.editar', 'roles', 'editar', 'Editar roles'),
    ('permisos', 'permisos.ver', 'permisos', 'ver', 'Ver permisos'),
    ('modulos', 'modulos.ver', 'modulos', 'ver', 'Ver modulos'),
    ('modulos', 'modulos.editar', 'modulos', 'editar', 'Editar modulos de empresa')
) AS p(modulo_clave, clave, modulo, accion, descripcion)
INNER JOIN "Modulo" m ON m.clave = p.modulo_clave
ON CONFLICT (clave) DO UPDATE SET
  id_modulo = EXCLUDED.id_modulo,
  modulo = EXCLUDED.modulo,
  accion = EXCLUDED.accion,
  descripcion = EXCLUDED.descripcion,
  activo = true;

INSERT INTO "Rol_permiso" (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM "Rol" r
CROSS JOIN "Permiso" p
WHERE r.es_sistema = true
AND r.estado = 'ACTIVO'
AND p.clave IN (
  'usuarios.ver',
  'usuarios.crear',
  'usuarios.editar',
  'roles.ver',
  'roles.crear',
  'roles.editar',
  'permisos.ver',
  'modulos.ver',
  'modulos.editar'
)
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
