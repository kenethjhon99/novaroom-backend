-- Reservation permissions needed by operational room actions.

INSERT INTO "Modulo" (nombre, clave, descripcion, es_premium, activo)
VALUES ('Reservas', 'reservas', 'Gestion de reservas y check-in', false, true)
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  activo = true,
  updated_at = NOW();

INSERT INTO "Permiso" (id_modulo, clave, modulo, accion, descripcion, activo)
SELECT m.id_modulo, p.clave, p.modulo, p.accion, p.descripcion, true
FROM (
  VALUES
    ('reservas', 'reservas.ver', 'reservas', 'ver', 'Ver reservas'),
    ('reservas', 'reservas.crear', 'reservas', 'crear', 'Crear reservas'),
    ('reservas', 'reservas.confirmar', 'reservas', 'confirmar', 'Confirmar reservas'),
    ('reservas', 'reservas.cancelar', 'reservas', 'cancelar', 'Cancelar reservas'),
    ('reservas', 'reservas.checkin', 'reservas', 'checkin', 'Realizar check-in desde reserva')
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
  'reservas.ver',
  'reservas.crear',
  'reservas.confirmar',
  'reservas.cancelar',
  'reservas.checkin'
)
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

INSERT INTO "Empresa_modulo" (id_empresa, id_modulo, activo, personalizado, beta, costo_extra)
SELECT e.id_empresa, m.id_modulo, true, false, false, 0
FROM "Empresa" e
CROSS JOIN "Modulo" m
WHERE e.deleted_at IS NULL
AND m.clave = 'reservas'
ON CONFLICT (id_empresa, id_modulo) DO UPDATE SET
  activo = true,
  updated_at = NOW();
