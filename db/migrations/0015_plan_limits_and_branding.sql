ALTER TABLE "Plan"
  ADD COLUMN IF NOT EXISTS max_sucursales integer DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS max_habitaciones integer DEFAULT 20 NOT NULL,
  ADD COLUMN IF NOT EXISTS max_usuarios integer DEFAULT 5 NOT NULL,
  ADD COLUMN IF NOT EXISTS max_roles integer DEFAULT 3 NOT NULL,
  ADD COLUMN IF NOT EXISTS max_modulos integer DEFAULT 10 NOT NULL,
  ADD COLUMN IF NOT EXISTS max_api_keys integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS almacenamiento_gb numeric(10,2) DEFAULT 5 NOT NULL,
  ADD COLUMN IF NOT EXISTS permite_bd_exclusiva boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS permite_dominio_propio boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS permite_api_externa boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS permite_offline boolean DEFAULT false NOT NULL;

UPDATE "Plan"
SET
  max_sucursales = CASE
    WHEN upper(nombre) LIKE '%PREMIUM%' THEN 999
    WHEN upper(nombre) LIKE '%PRO%' THEN 3
    ELSE max_sucursales
  END,
  max_habitaciones = CASE
    WHEN upper(nombre) LIKE '%PREMIUM%' THEN 9999
    WHEN upper(nombre) LIKE '%PRO%' THEN 80
    ELSE max_habitaciones
  END,
  max_usuarios = CASE
    WHEN upper(nombre) LIKE '%PREMIUM%' THEN 9999
    WHEN upper(nombre) LIKE '%PRO%' THEN 25
    ELSE max_usuarios
  END,
  max_roles = CASE
    WHEN upper(nombre) LIKE '%PREMIUM%' THEN 9999
    WHEN upper(nombre) LIKE '%PRO%' THEN 15
    ELSE max_roles
  END,
  max_modulos = CASE
    WHEN upper(nombre) LIKE '%PREMIUM%' THEN 999
    WHEN upper(nombre) LIKE '%PRO%' THEN 20
    ELSE max_modulos
  END,
  max_api_keys = CASE
    WHEN upper(nombre) LIKE '%PREMIUM%' THEN 10
    ELSE max_api_keys
  END,
  almacenamiento_gb = CASE
    WHEN upper(nombre) LIKE '%PREMIUM%' THEN 100
    WHEN upper(nombre) LIKE '%PRO%' THEN 25
    ELSE almacenamiento_gb
  END,
  permite_bd_exclusiva = CASE WHEN upper(nombre) LIKE '%PREMIUM%' THEN true ELSE permite_bd_exclusiva END,
  permite_dominio_propio = CASE WHEN upper(nombre) LIKE '%PREMIUM%' OR upper(nombre) LIKE '%PRO%' THEN true ELSE permite_dominio_propio END,
  permite_api_externa = CASE WHEN upper(nombre) LIKE '%PREMIUM%' THEN true ELSE permite_api_externa END,
  permite_offline = CASE WHEN upper(nombre) LIKE '%PREMIUM%' THEN true ELSE permite_offline END;

ALTER TABLE "Configuracion_empresa"
  ADD COLUMN IF NOT EXISTS nombre_publico character varying(120),
  ADD COLUMN IF NOT EXISTS color_primario character varying(20),
  ADD COLUMN IF NOT EXISTS logo_url text;

CREATE UNIQUE INDEX IF NOT EXISTS ux_empresa_limite_empresa
  ON "Empresa_limite"(id_empresa);
