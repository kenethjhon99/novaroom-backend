ALTER TABLE "Ocupacion"
  ADD COLUMN IF NOT EXISTS combo_horas integer,
  ADD COLUMN IF NOT EXISTS tarifa_nombre character varying(120),
  ADD COLUMN IF NOT EXISTS monto_tiempo_extra numeric(10,2) DEFAULT 0 NOT NULL;

