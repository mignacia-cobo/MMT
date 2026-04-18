-- Migración 011: Multi-asignación de proyectos y sede por proyecto

-- Sede del proyecto (hereda del postulante al crear)
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS id_sede INTEGER REFERENCES sedes(id) ON DELETE SET NULL;

-- Tabla de miembros del proyecto
CREATE TABLE IF NOT EXISTS proyecto_asignadas (
  id_proyecto INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  id_alumna   INTEGER NOT NULL REFERENCES alumnas(id)   ON DELETE CASCADE,
  PRIMARY KEY (id_proyecto, id_alumna)
);

-- Migrar lider existente a la tabla de asignadas
INSERT INTO proyecto_asignadas (id_proyecto, id_alumna)
SELECT id, id_lider FROM proyectos WHERE id_lider IS NOT NULL
ON CONFLICT DO NOTHING;

-- Asignar sede desde la postulante de cada proyecto
UPDATE proyectos p
SET    id_sede = (SELECT a.id_sede FROM alumnas a WHERE a.id = p.id_postulante)
WHERE  id_sede IS NULL;
