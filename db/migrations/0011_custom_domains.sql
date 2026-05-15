-- Custom domains for premium SaaS customers.

CREATE TABLE IF NOT EXISTS "Empresa_dominio" (
  id_empresa_dominio bigserial PRIMARY KEY,
  uuid_empresa_dominio uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  id_empresa bigint NOT NULL REFERENCES "Empresa"(id_empresa),
  dominio character varying(255) NOT NULL,
  tipo character varying(30) DEFAULT 'PANEL' NOT NULL,
  estado character varying(30) DEFAULT 'PENDIENTE' NOT NULL,
  proveedor character varying(30) DEFAULT 'MANUAL' NOT NULL,
  verificacion_token character varying(120) NOT NULL,
  ssl_activo boolean DEFAULT false NOT NULL,
  notas text,
  fecha_verificacion timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone,
  CONSTRAINT empresa_dominio_tipo_chk CHECK (tipo IN ('WEB', 'PANEL', 'RESERVAS', 'API')),
  CONSTRAINT empresa_dominio_estado_chk CHECK (estado IN ('PENDIENTE', 'VERIFICADO', 'ACTIVO', 'SUSPENDIDO')),
  CONSTRAINT empresa_dominio_proveedor_chk CHECK (proveedor IN ('VERCEL', 'RENDER', 'CLOUDFLARE', 'MANUAL'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_empresa_dominio_dominio
  ON "Empresa_dominio"(lower(dominio))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_empresa_dominio_empresa
  ON "Empresa_dominio"(id_empresa);

INSERT INTO "Modulo" (nombre, clave, descripcion, es_premium, activo)
VALUES (
  'Dominios personalizados',
  'dominios',
  'Gestion de dominios propios para web, panel, reservas y API',
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
    ('dominios.ver', 'dominios', 'ver', 'Ver dominios personalizados'),
    ('dominios.crear', 'dominios', 'crear', 'Registrar dominios personalizados'),
    ('dominios.editar', 'dominios', 'editar', 'Verificar, activar o suspender dominios')
) AS p(clave, modulo, accion, descripcion)
INNER JOIN "Modulo" m ON m.clave = 'dominios'
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
AND p.clave IN ('dominios.ver', 'dominios.crear', 'dominios.editar')
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
