-- Migración 007: Campo codigo_html en materiales
-- Permite adjuntar código HTML/JS interactivo que se renderiza en el detalle del material.
-- Ejecutar: docker exec postgres_mmt psql -U postgres -d mmt_valpo -f /docker-entrypoint-initdb.d/007_materiales_codigo.sql

ALTER TABLE materiales
  ADD COLUMN IF NOT EXISTS codigo_html TEXT;
