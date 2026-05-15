-- Default combo-hours tariff per room.

ALTER TABLE "Habitacion"
  ADD COLUMN IF NOT EXISTS combo_horas integer,
  ADD COLUMN IF NOT EXISTS precio_combo_horas numeric(12,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS tarifa_combo_nombre character varying(120);

UPDATE "Habitacion"
SET combo_horas = COALESCE(combo_horas, 3),
    precio_combo_horas = CASE
      WHEN COALESCE(precio_combo_horas, 0) = 0 AND COALESCE(precio_hora, 0) > 0
        THEN precio_hora
      ELSE COALESCE(precio_combo_horas, 0)
    END,
    tarifa_combo_nombre = COALESCE(tarifa_combo_nombre, 'Combo 3 horas')
WHERE combo_horas IS NULL
OR tarifa_combo_nombre IS NULL;
