CREATE TABLE IF NOT EXISTS "Refresh_token" (
  id_refresh_token bigserial PRIMARY KEY,
  id_usuario bigint NOT NULL REFERENCES "Usuario"(id_usuario),
  token_hash character varying(64) NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  revoked_at timestamp with time zone,
  ip character varying(80),
  user_agent text,
  created_at timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_usuario
  ON "Refresh_token"(id_usuario);

CREATE INDEX IF NOT EXISTS idx_refresh_token_active
  ON "Refresh_token"(token_hash)
  WHERE revoked_at IS NULL;
