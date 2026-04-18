-- Migración 003: Crear tablas tareas y comentarios_tareas
-- Ejecutar: psql -U postgres -d mmt_valpo -f migrations/003_create_tareas.sql

CREATE TABLE IF NOT EXISTS tareas (
  id              SERIAL PRIMARY KEY,
  titulo          TEXT        NOT NULL,
  descripcion     TEXT,
  prioridad       TEXT        NOT NULL DEFAULT 'MEDIA'
                    CHECK (prioridad IN ('ALTA', 'MEDIA', 'BAJA')),
  estado          TEXT        NOT NULL DEFAULT 'PENDIENTE'
                    CHECK (estado IN ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA')),
  ruta            TEXT        NOT NULL
                    CHECK (ruta IN ('LIDERAZGO', 'VOCACION', 'PROYECTOS')),
  id_asignada_a   INTEGER     REFERENCES alumnas(id) ON DELETE SET NULL,
  id_creada_por   INTEGER     NOT NULL REFERENCES alumnas(id) ON DELETE RESTRICT,
  lecciones       TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comentarios_tareas (
  id          SERIAL PRIMARY KEY,
  id_tarea    INTEGER     NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  id_alumna   INTEGER     NOT NULL REFERENCES alumnas(id) ON DELETE CASCADE,
  contenido   TEXT        NOT NULL,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
