-- Migración 012: Asociar tareas a hitos y agregar fecha límite propia

-- Asociación tarea → hito (opcional)
ALTER TABLE tareas
  ADD COLUMN IF NOT EXISTS id_hito    INTEGER REFERENCES hitos(id) ON DELETE SET NULL;

-- Fecha límite propia de la tarea (independiente del hito)
ALTER TABLE tareas
  ADD COLUMN IF NOT EXISTS fecha_limite DATE;
