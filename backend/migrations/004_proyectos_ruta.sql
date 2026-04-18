-- Migración 004: Rutas en proyectos y ruta_asignada en alumnas
-- Ejecutar: psql -U postgres -d mmt_valpo -f migrations/004_proyectos_ruta.sql

-- Añadir ruta al proyecto (a qué ruta MMT pertenece)
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS ruta TEXT
    CHECK (ruta IN ('LIDERAZGO', 'VOCACION', 'PROYECTOS')),
  ADD COLUMN IF NOT EXISTS id_postulante INTEGER
    REFERENCES alumnas(id) ON DELETE SET NULL;

-- Añadir ruta_asignada a alumnas (solo LIDERs tienen este campo)
ALTER TABLE alumnas
  ADD COLUMN IF NOT EXISTS ruta_asignada TEXT
    CHECK (ruta_asignada IN ('LIDERAZGO', 'VOCACION', 'PROYECTOS'));

-- Asignar ruta PROYECTOS a la LIDER de demo
UPDATE alumnas
   SET ruta_asignada = 'PROYECTOS'
 WHERE email = 'lider@mmt.cl';

-- Asociar proyectos de demo a la ruta PROYECTOS y a la postulante demo
UPDATE proyectos
   SET ruta         = 'PROYECTOS',
       id_postulante = (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl')
 WHERE nombre IN (
   'App de Orientación Vocacional STEM',
   'Plataforma de Tutoría entre Pares',
   'Asistente IA para Debugging'
 );
