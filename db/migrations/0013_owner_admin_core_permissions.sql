-- Ensure existing owner/admin company roles can operate the MVP modules.
-- Earlier seed migrations granted permissions only to system roles; some
-- imported databases already have owner roles created as company roles.

INSERT INTO "Rol_permiso" (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM "Rol" r
CROSS JOIN "Permiso" p
WHERE r.id_empresa IS NOT NULL
AND r.deleted_at IS NULL
AND r.estado = 'ACTIVO'
AND (
  r.nombre ILIKE 'Due%'
  OR r.nombre ILIKE 'Propietario%'
  OR r.nombre ILIKE 'Admin%'
)
AND p.activo = true
AND p.clave IN (
  'sucursales.ver',
  'sucursales.crear',
  'sucursales.editar',
  'usuarios.ver',
  'usuarios.crear',
  'usuarios.editar',
  'roles.ver',
  'roles.crear',
  'roles.editar',
  'permisos.ver',
  'modulos.ver',
  'modulos.editar',
  'habitaciones.ver',
  'habitaciones.ver_mapa',
  'habitaciones.crear',
  'habitaciones.editar',
  'habitaciones.cambiar_estado',
  'habitaciones.limpieza',
  'ocupaciones.ver',
  'ocupaciones.abrir',
  'ocupaciones.cerrar',
  'reservas.ver',
  'reservas.crear',
  'reservas.editar',
  'reservas.confirmar',
  'reservas.cancelar',
  'caja.ver',
  'caja.abrir',
  'caja.cerrar',
  'inventario.ver',
  'inventario.editar',
  'reportes.ver'
)
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
