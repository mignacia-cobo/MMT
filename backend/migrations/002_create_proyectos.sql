-- Migración 002: Crear tabla proyectos
-- Ejecutar: psql -U postgres -d mmt_valpo -f migrations/002_create_proyectos.sql

CREATE TABLE IF NOT EXISTS proyectos (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT        NOT NULL,
  descripcion TEXT,
  estado      TEXT        NOT NULL DEFAULT 'PENDIENTE'
                CHECK (estado IN ('PENDIENTE', 'EN_REVISION', 'APROBADO', 'FINALIZADO')),
  id_lider    INTEGER     REFERENCES alumnas(id) ON DELETE SET NULL,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
