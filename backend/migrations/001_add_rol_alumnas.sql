-- Migración 001: Agregar campo rol a la tabla alumnas
-- Ejecutar: psql -U postgres -d mmt_valpo -f migrations/001_add_rol_alumnas.sql

-- Crea el tipo si no existe (para entornos sin el schema inicial)
DO $$ BEGIN
  CREATE TYPE rol_alumna AS ENUM ('ADMIN', 'LIDER', 'ALUMNA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE alumnas
  ADD COLUMN IF NOT EXISTS rol rol_alumna NOT NULL DEFAULT 'ALUMNA';
