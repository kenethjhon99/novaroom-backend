-- Security administration must be available to every company owner/admin.
-- Without these active modules, the frontend hides Roles/Permisos even when
-- the owner has the permissions.

INSERT INTO "Empresa_modulo" (
  id_empresa,
  id_modulo,
  activo,
  personalizado,
  beta,
  costo_extra
)
SELECT
  e.id_empresa,
  m.id_modulo,
  true,
  false,
  false,
  0
FROM "Empresa" e
CROSS JOIN "Modulo" m
WHERE e.deleted_at IS NULL
AND m.clave IN ('usuarios', 'roles', 'permisos')
AND m.activo = true
ON CONFLICT (id_empresa, id_modulo)
DO UPDATE SET
  activo = true,
  updated_at = NOW();
