-- =====================================================================
-- schema.sql  —  Esquema de base de datos de MMT Valpo Hub
-- =====================================================================
--
-- INSTRUCCIONES PARA EJECUTAR:
--   1. Crea la base de datos: createdb mmt_valpo
--   2. Conéctate: psql -d mmt_valpo
--   3. Ejecuta este archivo: \i schema.sql
--
-- DIAGRAMA DE RELACIONES:
--
--   alumnas ──< materiales >── asignaturas
--      │
--      └──< materiales_guardados  (alumna guarda un material)
--
-- CONVENCIÓN DE NOMBRES:
--   - Tablas en español, plural
--   - Columnas en español con snake_case
--   - Claves foráneas: id_<tabla_referenciada>
-- =====================================================================

-- -------------------------------------------------------
-- TABLA: alumnas
-- Guarda los datos de cada participante del programa MMT.
-- -------------------------------------------------------
CREATE TABLE alumnas (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(120)        NOT NULL,
  email         VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255)        NOT NULL,          -- contraseña cifrada con bcrypt
  carrera       VARCHAR(120),
  anio_cohorte  INTEGER             NOT NULL DEFAULT 2026,
  avatar_url    TEXT,                                  -- URL de foto de perfil (opcional)
  creado_en     TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLA: asignaturas
-- Categorías bajo las que se organizan los materiales.
-- -------------------------------------------------------
CREATE TABLE asignaturas (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(120) UNIQUE NOT NULL,
  codigo      VARCHAR(20)  UNIQUE,                    -- Ej: "DW101", "BD201"
  descripcion TEXT,
  activa      BOOLEAN      NOT NULL DEFAULT TRUE       -- permite desactivar sin borrar
);

-- -------------------------------------------------------
-- TABLA: materiales
-- Núcleo del módulo de continuidad.
-- Cada material fue creado/subido por una alumna.
-- -------------------------------------------------------
CREATE TABLE materiales (
  id             SERIAL PRIMARY KEY,
  titulo         VARCHAR(200)  NOT NULL,
  descripcion    TEXT,
  nombre_archivo VARCHAR(255)  NOT NULL,              -- nombre original del archivo
  url_archivo    TEXT          NOT NULL,              -- ruta local o URL en S3 (producción)
  tamano_bytes   INTEGER,                             -- tamaño del archivo en bytes
  tipo_archivo   VARCHAR(10),                         -- 'pdf' | 'imagen' | 'codigo' | 'otro'
  id_asignatura  INTEGER       NOT NULL REFERENCES asignaturas(id) ON DELETE RESTRICT,
  id_alumna      INTEGER       NOT NULL REFERENCES alumnas(id)     ON DELETE CASCADE,
  descargas      INTEGER       NOT NULL DEFAULT 0,    -- contador de descargas
  creado_en      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLA: materiales_guardados
-- Una alumna puede guardar/marcar materiales de otras para releerlos.
-- Relación muchos-a-muchos entre alumnas y materiales.
-- -------------------------------------------------------
CREATE TABLE materiales_guardados (
  id_alumna    INTEGER NOT NULL REFERENCES alumnas(id)    ON DELETE CASCADE,
  id_material  INTEGER NOT NULL REFERENCES materiales(id) ON DELETE CASCADE,
  guardado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_alumna, id_material)   -- clave compuesta: evita duplicados
);

-- -------------------------------------------------------
-- ÍNDICES para mejorar el rendimiento de consultas frecuentes
-- -------------------------------------------------------
CREATE INDEX idx_materiales_asignatura ON materiales(id_asignatura);
CREATE INDEX idx_materiales_alumna     ON materiales(id_alumna);
CREATE INDEX idx_materiales_creado     ON materiales(creado_en DESC);

-- -------------------------------------------------------
-- FUNCIÓN + TRIGGER: actualiza automaticamente actualizado_en
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_materiales_timestamp
  BEFORE UPDATE ON materiales
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- -------------------------------------------------------
-- VISTA: vista_materiales_completa
-- Une materiales con su autora y asignatura en una sola consulta.
-- Muy útil para mostrar las cards en el frontend.
-- -------------------------------------------------------
CREATE VIEW vista_materiales_completa AS
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
  -- datos de la asignatura
  a.id           AS id_asignatura,
  a.nombre       AS nombre_asignatura,
  a.codigo       AS codigo_asignatura,
  -- datos de la autora
  al.id          AS id_alumna,
  al.nombre      AS nombre_alumna,
  al.carrera     AS carrera_alumna,
  al.avatar_url  AS avatar_alumna
FROM materiales m
JOIN asignaturas a  ON a.id  = m.id_asignatura
JOIN alumnas     al ON al.id = m.id_alumna
ORDER BY m.creado_en DESC;
