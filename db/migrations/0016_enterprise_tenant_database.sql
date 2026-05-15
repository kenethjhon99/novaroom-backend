-- Enterprise preparation: dedicated database registry per premium tenant.

CREATE TABLE IF NOT EXISTS "Tenant_database" (
  id_tenant_database bigserial PRIMARY KEY,
  uuid_tenant_database uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  id_empresa bigint NOT NULL REFERENCES "Empresa"(id_empresa),
  tipo character varying(30) DEFAULT 'DEDICADA' NOT NULL,
  proveedor character varying(30) DEFAULT 'NEON' NOT NULL,
  estado character varying(30) DEFAULT 'PENDIENTE' NOT NULL,
  connection_ref text,
  database_name character varying(160),
  region character varying(80),
  ssl_required boolean DEFAULT true NOT NULL,
  migracion_estado character varying(30) DEFAULT 'NO_INICIADA' NOT NULL,
  migracion_version character varying(80),
  ultimo_backup_at timestamp with time zone,
  last_health_check_at timestamp with time zone,
  health_status character varying(30) DEFAULT 'DESCONOCIDO' NOT NULL,
  notas text,
  creado_por bigint REFERENCES "Usuario"(id_usuario),
  activated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone,
  CONSTRAINT tenant_database_tipo_chk CHECK (tipo IN ('COMPARTIDA', 'DEDICADA')),
  CONSTRAINT tenant_database_proveedor_chk CHECK (proveedor IN ('NEON', 'POSTGRES', 'RENDER', 'MANUAL')),
  CONSTRAINT tenant_database_estado_chk CHECK (estado IN ('PENDIENTE', 'PROVISIONANDO', 'LISTA', 'MIGRANDO', 'ACTIVA', 'SUSPENDIDA', 'ERROR')),
  CONSTRAINT tenant_database_migracion_chk CHECK (migracion_estado IN ('NO_INICIADA', 'PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'ERROR')),
  CONSTRAINT tenant_database_health_chk CHECK (health_status IN ('DESCONOCIDO', 'OK', 'ERROR'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_tenant_database_empresa_activa
  ON "Tenant_database"(id_empresa)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tenant_database_estado
  ON "Tenant_database"(estado)
  WHERE deleted_at IS NULL;

INSERT INTO "Modulo" (nombre, clave, descripcion, es_premium, activo)
VALUES (
  'BD dedicada',
  'tenant_database',
  'Preparacion y control de bases de datos dedicadas para clientes enterprise',
  true,
  true
)
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  es_premium = true,
  activo = true,
  updated_at = NOW();

INSERT INTO "Permiso" (id_modulo, clave, modulo, accion, descripcion, activo)
SELECT m.id_modulo, p.clave, p.modulo, p.accion, p.descripcion, true
FROM (
  VALUES
    ('tenant_database.ver', 'tenant_database', 'ver', 'Ver configuracion de BD dedicada'),
    ('tenant_database.crear', 'tenant_database', 'crear', 'Registrar BD dedicada'),
    ('tenant_database.editar', 'tenant_database', 'editar', 'Actualizar estado de BD dedicada'),
    ('tenant_database.verificar', 'tenant_database', 'verificar', 'Registrar health check de BD dedicada')
) AS p(clave, modulo, accion, descripcion)
INNER JOIN "Modulo" m ON m.clave = 'tenant_database'
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
  'tenant_database.ver',
  'tenant_database.crear',
  'tenant_database.editar',
  'tenant_database.verificar'
)
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
