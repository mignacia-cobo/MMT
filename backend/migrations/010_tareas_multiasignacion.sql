-- Migración 010: Multi-asignación de tareas y sede por tarea

-- Sede de la tarea (hereda del creador al crear)
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS id_sede INTEGER REFERENCES sedes(id) ON DELETE SET NULL;

-- Tabla de asignación múltiple
CREATE TABLE IF NOT EXISTS tarea_asignadas (
  id_tarea  INTEGER NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  id_alumna INTEGER NOT NULL REFERENCES alumnas(id) ON DELETE CASCADE,
  PRIMARY KEY (id_tarea, id_alumna)
);

-- Migrar asignaciones individuales existentes
INSERT INTO tarea_asignadas (id_tarea, id_alumna)
SELECT id, id_asignada_a FROM tareas WHERE id_asignada_a IS NOT NULL
ON CONFLICT DO NOTHING;

-- Asignar sede desde el creador de cada tarea
UPDATE tareas t
SET    id_sede = (SELECT a.id_sede FROM alumnas a WHERE a.id = t.id_creada_por)
WHERE  id_sede IS NULL;
