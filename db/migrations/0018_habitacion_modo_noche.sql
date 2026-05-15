ALTER TABLE "Habitacion"
ADD COLUMN IF NOT EXISTS permite_noche boolean NOT NULL DEFAULT true;

UPDATE "Habitacion"
SET permite_noche = true
WHERE permite_noche IS NULL;
