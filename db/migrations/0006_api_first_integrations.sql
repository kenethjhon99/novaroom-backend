-- API-first integration primitives: API keys, webhook delivery logs and permissions.

CREATE TABLE IF NOT EXISTS "Api_key" (
  id_api_key bigserial PRIMARY KEY,
  uuid_api_key uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  id_empresa bigint NOT NULL REFERENCES "Empresa"(id_empresa),
  nombre character varying(120) NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix character varying(20) NOT NULL,
  scopes jsonb DEFAULT '[]'::jsonb NOT NULL,
  activo boolean DEFAULT true NOT NULL,
  ultimo_uso_at timestamp with time zone,
  expira_at timestamp with time zone,
  creado_por bigint REFERENCES "Usuario"(id_usuario),
  revoked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_key_empresa ON "Api_key"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_api_key_hash ON "Api_key"(key_hash);

CREATE TABLE IF NOT EXISTS "Webhook_entrega_log" (
  id_webhook_entrega_log bigserial PRIMARY KEY,
  uuid_webhook_entrega_log uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  id_empresa bigint NOT NULL REFERENCES "Empresa"(id_empresa),
  id_webhook_empresa bigint NOT NULL REFERENCES "Webhook_empresa"(id_webhook_empresa),
  evento character varying(120) NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  status_code integer,
  ok boolean DEFAULT false NOT NULL,
  intento integer DEFAULT 1 NOT NULL,
  error text,
  enviado_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_entrega_empresa ON "Webhook_entrega_log"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_webhook_entrega_webhook ON "Webhook_entrega_log"(id_webhook_empresa);
CREATE INDEX IF NOT EXISTS idx_webhook_entrega_evento ON "Webhook_entrega_log"(evento);

INSERT INTO "Modulo" (nombre, clave, descripcion, es_premium, activo)
VALUES
  ('API Keys', 'api_keys', 'Gestion de credenciales para integraciones externas', true, true),
  ('Webhooks', 'webhooks', 'Configuracion de webhooks por empresa', true, true),
  ('Logs de integracion', 'integration_logs', 'Trazabilidad de entregas e integraciones', true, true)
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  activo = true,
  updated_at = NOW();

INSERT INTO "Permiso" (id_modulo, clave, modulo, accion, descripcion, activo)
SELECT m.id_modulo, p.clave, p.modulo, p.accion, p.descripcion, true
FROM (
  VALUES
    ('api_keys', 'api_keys.ver', 'api_keys', 'ver', 'Ver API keys'),
    ('api_keys', 'api_keys.crear', 'api_keys', 'crear', 'Crear API keys'),
    ('api_keys', 'api_keys.editar', 'api_keys', 'editar', 'Revocar API keys'),
    ('webhooks', 'webhooks.ver', 'webhooks', 'ver', 'Ver webhooks'),
    ('webhooks', 'webhooks.crear', 'webhooks', 'crear', 'Crear webhooks'),
    ('webhooks', 'webhooks.editar', 'webhooks', 'editar', 'Editar webhooks'),
    ('integration_logs', 'integration_logs.ver', 'integration_logs', 'ver', 'Ver logs de integracion')
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
  'api_keys.ver',
  'api_keys.crear',
  'api_keys.editar',
  'webhooks.ver',
  'webhooks.crear',
  'webhooks.editar',
  'integration_logs.ver'
)
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
