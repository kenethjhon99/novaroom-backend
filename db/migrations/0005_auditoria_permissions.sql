-- Audit module and permissions.

INSERT INTO "Modulo" (nombre, clave, descripcion, es_premium, activo)
VALUES ('Auditoria', 'auditoria', 'Consulta de trazabilidad de acciones criticas', false, true)
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  activo = true,
  updated_at = NOW();

INSERT INTO "Permiso" (id_modulo, clave, modulo, accion, descripcion, activo)
SELECT m.id_modulo, 'auditoria.ver', 'auditoria', 'ver', 'Ver auditoria del sistema', true
FROM "Modulo" m
WHERE m.clave = 'auditoria'
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
AND p.clave = 'auditoria.ver'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
