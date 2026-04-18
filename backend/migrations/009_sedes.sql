-- Migración 009: Sedes, permisos multi-sede y campos asociados
-- Ejecutar: docker exec postgres_mmt psql -U postgres -d mmt_valpo -f /docker-entrypoint-initdb.d/009_sedes.sql

CREATE TABLE IF NOT EXISTS sedes (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT        NOT NULL,
  ciudad    TEXT        NOT NULL,
  activa    BOOLEAN     NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sede de las alumnas y contenido
ALTER TABLE alumnas  ADD COLUMN IF NOT EXISTS id_sede INTEGER REFERENCES sedes(id) ON DELETE SET NULL;
ALTER TABLE noticias ADD COLUMN IF NOT EXISTS id_sede INTEGER REFERENCES sedes(id) ON DELETE SET NULL;

-- Permisos de sede para admins con acceso restringido
-- Si un ADMIN no tiene registros aquí → ve todas las sedes
-- Si tiene registros → solo esas sedes
CREATE TABLE IF NOT EXISTS admin_sedes (
  id_admin  INTEGER NOT NULL REFERENCES alumnas(id) ON DELETE CASCADE,
  id_sede   INTEGER NOT NULL REFERENCES sedes(id)  ON DELETE CASCADE,
  PRIMARY KEY (id_admin, id_sede)
);

-- Sede inicial
INSERT INTO sedes (nombre, ciudad)
VALUES ('Sede Valparaiso', 'Valparaiso')
ON CONFLICT DO NOTHING;

-- Asignar sede Valparaiso a todos los usuarios existentes
UPDATE alumnas
   SET id_sede = (SELECT id FROM sedes WHERE ciudad = 'Valparaiso' LIMIT 1)
 WHERE id_sede IS NULL;
