-- Migración 008: Hace opcional el archivo adjunto en materiales
-- Ejecutar: docker exec postgres_mmt psql -U postgres -d mmt_valpo -f /docker-entrypoint-initdb.d/008_materiales_archivo_opcional.sql

ALTER TABLE materiales
  ALTER COLUMN nombre_archivo DROP NOT NULL,
  ALTER COLUMN url_archivo    DROP NOT NULL;
