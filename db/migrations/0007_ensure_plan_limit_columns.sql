-- Safety migration for databases created before plan module/API key limits existed.

ALTER TABLE "Empresa_limite"
  ADD COLUMN IF NOT EXISTS max_modulos integer DEFAULT 999 NOT NULL,
  ADD COLUMN IF NOT EXISTS max_api_keys integer DEFAULT 0 NOT NULL;

UPDATE "Empresa_limite"
SET
  max_modulos = COALESCE(
    max_modulos,
    CASE
      WHEN permite_api_externa = true OR permite_bd_exclusiva = true THEN 999
      WHEN max_sucursales >= 3 THEN 20
      ELSE 10
    END
  ),
  max_api_keys = COALESCE(
    max_api_keys,
    CASE
      WHEN permite_api_externa = true THEN 10
      ELSE 0
    END
  );
