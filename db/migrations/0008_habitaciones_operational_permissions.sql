-- Operational modules and permissions for rooms, layout catalogs and occupancy flows.

ALTER TABLE "Empresa_modulo"
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT NOW() NOT NULL;

INSERT INTO "Modulo" (nombre, clave, descripcion, es_premium, activo)
VALUES
  ('Habitaciones', 'habitaciones', 'Mapa y administracion de habitaciones', false, true),
  ('Ocupaciones', 'ocupaciones', 'Apertura, cierre e historial de ocupaciones', false, true),
  ('Areas', 'areas', 'Configuracion de areas operativas por sucursal', false, true),
  ('Niveles', 'niveles', 'Configuracion de niveles o plantas por area', false, true)
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  activo = true,
  updated_at = NOW();

INSERT INTO "Permiso" (id_modulo, clave, modulo, accion, descripcion, activo)
SELECT m.id_modulo, p.clave, p.modulo, p.accion, p.descripcion, true
FROM (
  VALUES
    ('habitaciones', 'habitaciones.ver', 'habitaciones', 'ver', 'Ver habitaciones'),
    ('habitaciones', 'habitaciones.ver_mapa', 'habitaciones', 'ver_mapa', 'Ver mapa de habitaciones'),
    ('habitaciones', 'habitaciones.crear', 'habitaciones', 'crear', 'Crear habitaciones'),
    ('habitaciones', 'habitaciones.editar', 'habitaciones', 'editar', 'Editar habitaciones'),
    ('habitaciones', 'habitaciones.cambiar_estado', 'habitaciones', 'cambiar_estado', 'Cambiar estado de habitaciones'),
    ('habitaciones', 'habitaciones.limpieza', 'habitaciones', 'limpieza', 'Finalizar limpieza de habitaciones'),
    ('ocupaciones', 'ocupaciones.ver', 'ocupaciones', 'ver', 'Ver ocupaciones'),
    ('ocupaciones', 'ocupaciones.abrir', 'ocupaciones', 'abrir', 'Abrir ocupaciones'),
    ('ocupaciones', 'ocupaciones.cerrar', 'ocupaciones', 'cerrar', 'Cerrar ocupaciones'),
    ('areas', 'areas.ver', 'areas', 'ver', 'Ver areas'),
    ('areas', 'areas.crear', 'areas', 'crear', 'Crear areas'),
    ('areas', 'areas.editar', 'areas', 'editar', 'Editar areas'),
    ('niveles', 'niveles.ver', 'niveles', 'ver', 'Ver niveles'),
    ('niveles', 'niveles.crear', 'niveles', 'crear', 'Crear niveles'),
    ('niveles', 'niveles.editar', 'niveles', 'editar', 'Editar niveles')
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
  'habitaciones.ver',
  'habitaciones.ver_mapa',
  'habitaciones.crear',
  'habitaciones.editar',
  'habitaciones.cambiar_estado',
  'habitaciones.limpieza',
  'ocupaciones.ver',
  'ocupaciones.abrir',
  'ocupaciones.cerrar',
  'areas.ver',
  'areas.crear',
  'areas.editar',
  'niveles.ver',
  'niveles.crear',
  'niveles.editar'
)
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

INSERT INTO "Empresa_modulo" (id_empresa, id_modulo, activo, personalizado, beta, costo_extra)
SELECT e.id_empresa, m.id_modulo, true, false, false, 0
FROM "Empresa" e
CROSS JOIN "Modulo" m
WHERE e.deleted_at IS NULL
AND m.clave IN ('habitaciones', 'ocupaciones', 'areas', 'niveles')
ON CONFLICT (id_empresa, id_modulo) DO UPDATE SET
  activo = true,
  updated_at = NOW();
