-- Migración 005: Asociar tareas a proyectos
-- Ejecutar: psql -U postgres -d mmt_valpo -f migrations/005_tareas_proyecto.sql

ALTER TABLE tareas
  ADD COLUMN IF NOT EXISTS id_proyecto INTEGER
    REFERENCES proyectos(id) ON DELETE SET NULL;
