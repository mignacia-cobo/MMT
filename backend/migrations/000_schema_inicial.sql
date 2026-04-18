-- Schema inicial MMT Valpo Hub
-- Este archivo se ejecuta automáticamente al crear el contenedor Docker.
-- Las migraciones 001, 002... se ejecutan después (orden alfabético).

-- ============================================================
-- TIPOS ENUM
-- ============================================================

DO $$ BEGIN
  CREATE TYPE rol_alumna AS ENUM ('ADMIN', 'LIDER', 'ALUMNA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS alumnas (
  id            SERIAL PRIMARY KEY,
  nombre        TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  carrera       TEXT,
  anio_cohorte  INTEGER     NOT NULL DEFAULT 2026,
  avatar_url    TEXT,
  rol           rol_alumna  NOT NULL DEFAULT 'ALUMNA',
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asignaturas (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT    NOT NULL UNIQUE,
  codigo      TEXT,
  descripcion TEXT,
  activa      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS materiales (
  id             SERIAL PRIMARY KEY,
  titulo         TEXT        NOT NULL,
  descripcion    TEXT,
  nombre_archivo TEXT        NOT NULL,
  url_archivo    TEXT        NOT NULL,
  tipo_archivo   TEXT        NOT NULL,
  tamano_bytes   BIGINT,
  descargas      INTEGER     NOT NULL DEFAULT 0,
  id_asignatura  INTEGER     NOT NULL REFERENCES asignaturas(id) ON DELETE RESTRICT,
  id_alumna      INTEGER     NOT NULL REFERENCES alumnas(id)     ON DELETE CASCADE,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proyectos (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT        NOT NULL,
  descripcion TEXT,
  estado      TEXT        NOT NULL DEFAULT 'PENDIENTE'
                CHECK (estado IN ('PENDIENTE', 'EN_REVISION', 'APROBADO', 'FINALIZADO')),
  id_lider    INTEGER     REFERENCES alumnas(id) ON DELETE SET NULL,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VISTAS
-- ============================================================

CREATE OR REPLACE VIEW vista_materiales_completa AS
  SELECT
    m.id,
    m.titulo,
    m.descripcion,
    m.nombre_archivo,
    m.url_archivo,
    m.tipo_archivo,
    m.tamano_bytes,
    m.descargas,
    m.creado_en,
    a.id          AS id_asignatura,
    a.nombre      AS nombre_asignatura,
    a.codigo      AS codigo_asignatura,
    al.id         AS id_alumna,
    al.nombre     AS nombre_alumna,
    al.carrera    AS carrera_alumna,
    al.avatar_url AS avatar_alumna
  FROM materiales  m
  JOIN asignaturas a  ON a.id  = m.id_asignatura
  JOIN alumnas     al ON al.id = m.id_alumna;
