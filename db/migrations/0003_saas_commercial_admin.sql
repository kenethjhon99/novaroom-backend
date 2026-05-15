-- SaaS commercial administration modules, permissions and subscriptions.

CREATE TABLE IF NOT EXISTS "Suscripcion" (
  id_suscripcion bigserial PRIMARY KEY,
  uuid_suscripcion uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  id_empresa bigint NOT NULL REFERENCES "Empresa"(id_empresa),
  id_plan bigint NOT NULL REFERENCES "Plan"(id_plan),
  id_licencia bigint REFERENCES "Licencia"(id_licencia),
  estado character varying(30) DEFAULT 'ACTIVA' NOT NULL,
  ciclo character varying(30) DEFAULT 'MENSUAL' NOT NULL,
  monto numeric(10,2) DEFAULT 0 NOT NULL,
  moneda character varying(10) DEFAULT 'GTQ' NOT NULL,
  fecha_inicio date DEFAULT CURRENT_DATE NOT NULL,
  fecha_fin date,
  proximo_cobro date,
  observaciones text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_suscripcion_empresa
  ON "Suscripcion"(id_empresa)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_suscripcion_estado
  ON "Suscripcion"(estado)
  WHERE deleted_at IS NULL;

INSERT INTO "Modulo" (nombre, clave, descripcion, es_premium, activo)
VALUES
  ('Planes', 'planes', 'Gestion de planes SaaS', false, true),
  ('Licencias', 'licencias', 'Control operativo de licencias por empresa', false, true),
  ('Suscripciones', 'suscripciones', 'Control comercial de suscripciones SaaS', false, true),
  ('Empresas', 'empresas', 'Administracion de empresas cliente', false, true),
  ('Sucursales', 'sucursales', 'Administracion de sucursales por empresa', false, true)
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  activo = true,
  updated_at = NOW();

INSERT INTO "Permiso" (id_modulo, clave, modulo, accion, descripcion, activo)
SELECT m.id_modulo, p.clave, p.modulo, p.accion, p.descripcion, true
FROM (
  VALUES
    ('planes', 'planes.ver', 'planes', 'ver', 'Ver planes SaaS'),
    ('planes', 'planes.crear', 'planes', 'crear', 'Crear planes SaaS'),
    ('planes', 'planes.editar', 'planes', 'editar', 'Editar planes SaaS'),
    ('licencias', 'licencias.ver', 'licencias', 'ver', 'Ver licencias'),
    ('licencias', 'licencias.crear', 'licencias', 'crear', 'Crear licencias'),
    ('licencias', 'licencias.editar', 'licencias', 'editar', 'Editar licencias'),
    ('suscripciones', 'suscripciones.ver', 'suscripciones', 'ver', 'Ver suscripciones'),
    ('suscripciones', 'suscripciones.crear', 'suscripciones', 'crear', 'Crear suscripciones'),
    ('suscripciones', 'suscripciones.editar', 'suscripciones', 'editar', 'Editar suscripciones'),
    ('empresas', 'empresas.editar', 'empresas', 'editar', 'Editar empresas'),
    ('sucursales', 'sucursales.ver', 'sucursales', 'ver', 'Ver sucursales'),
    ('sucursales', 'sucursales.crear', 'sucursales', 'crear', 'Crear sucursales'),
    ('sucursales', 'sucursales.editar', 'sucursales', 'editar', 'Editar sucursales')
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
  'planes.ver',
  'planes.crear',
  'planes.editar',
  'licencias.ver',
  'licencias.crear',
  'licencias.editar',
  'suscripciones.ver',
  'suscripciones.crear',
  'suscripciones.editar',
  'empresas.editar',
  'sucursales.ver',
  'sucursales.crear',
  'sucursales.editar'
)
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
