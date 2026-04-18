-- Migración 006: Tablas noticias, comentarios, likes y hitos
-- Ejecutar: psql -U postgres -d mmt_valpo -f migrations/006_noticias_hitos.sql

CREATE TABLE IF NOT EXISTS noticias (
  id             SERIAL PRIMARY KEY,
  titulo         TEXT        NOT NULL,
  contenido      TEXT        NOT NULL,
  imagen_url     TEXT,
  id_autora      INTEGER     NOT NULL REFERENCES alumnas(id) ON DELETE RESTRICT,
  publicada      BOOLEAN     NOT NULL DEFAULT FALSE,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comentarios_noticias (
  id         SERIAL PRIMARY KEY,
  id_noticia INTEGER     NOT NULL REFERENCES noticias(id) ON DELETE CASCADE,
  id_alumna  INTEGER     NOT NULL REFERENCES alumnas(id)  ON DELETE CASCADE,
  contenido  TEXT        NOT NULL,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PK compuesta evita que la misma alumna dé like más de una vez
CREATE TABLE IF NOT EXISTS likes_noticias (
  id_noticia INTEGER     NOT NULL REFERENCES noticias(id) ON DELETE CASCADE,
  id_alumna  INTEGER     NOT NULL REFERENCES alumnas(id)  ON DELETE CASCADE,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_noticia, id_alumna)
);

CREATE TABLE IF NOT EXISTS hitos (
  id          SERIAL PRIMARY KEY,
  titulo      TEXT NOT NULL,
  descripcion TEXT,
  fecha       DATE NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'FUTURO'
                CHECK (tipo IN ('PASADO', 'ACTUAL', 'FUTURO')),
  orden       INTEGER NOT NULL DEFAULT 0,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
