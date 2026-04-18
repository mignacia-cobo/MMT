-- Datos demo: noticias y hitos del cronograma 2026
-- Ejecutar: Get-Content backend/seeds/seed_noticias.sql | docker exec -i postgres_mmt psql -U postgres -d mmt_valpo

BEGIN;

-- Limpiar datos demo previos
DELETE FROM comentarios_noticias WHERE id_alumna IN (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl');
DELETE FROM noticias WHERE id_autora IN (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl');
DELETE FROM hitos;

-- ============================================================
-- NOTICIAS
-- ============================================================

INSERT INTO noticias (titulo, contenido, imagen_url, id_autora, publicada) VALUES

  ('¡Bienvenidas a la Cohorte MMT Valparaíso 2026!',
   'Con gran entusiasmo damos inicio a una nueva cohorte del programa Mentoring & Talent en Duoc UC Valparaíso. Este año contamos con 24 alumnas seleccionadas de distintas carreras del área de tecnología, quienes durante los próximos meses participarán en talleres de liderazgo, exploración vocacional y desarrollo de proyectos innovadores. ¡Las acompañamos en cada paso!',
   NULL,
   (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl'),
   TRUE),

  ('Resultados Demo Day — Proyectos de Ruta 3',
   'Felicitamos a todas las alumnas que presentaron sus proyectos ante el panel evaluador en el Demo Day de abril. Tres proyectos fueron aprobados y pasan a la etapa de incubación: App de Orientación Vocacional STEM, Plataforma de Tutoría entre Pares y el Asistente IA para Debugging. ¡Orgullo de ver el talento de nuestras alumnas!',
   NULL,
   (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl'),
   TRUE),

  ('Próxima Actividad: Charla "Mujeres que Lideran en Tech"',
   'Este mes tendremos una charla especial con cuatro referentes de la industria tecnológica nacional. Las panelistas compartirán sus trayectorias, desafíos y consejos para alumnas que están iniciando su camino en el mundo tecnológico. La actividad es abierta a toda la comunidad MMT. Fecha: 28 de abril, 15:00 h, sala A-301.',
   NULL,
   (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl'),
   TRUE);

-- ============================================================
-- HITOS DEL CRONOGRAMA 2026
-- ============================================================

INSERT INTO hitos (titulo, descripcion, fecha, tipo, orden) VALUES
  ('Inicio del Programa MMT 2026',
   'Ceremonia de bienvenida, inducción al programa y presentación del equipo.',
   '2026-03-10', 'PASADO', 1),

  ('Taller de Liderazgo Femenino',
   'Workshop con mentoras de la industria. Técnicas de comunicación y liderazgo.',
   '2026-04-15', 'ACTUAL', 2),

  ('Demo Day · Ruta Proyectos',
   'Presentación de MVPs ante panel evaluador externo. 8 minutos por proyecto.',
   '2026-05-20', 'FUTURO', 3),

  ('Feria de Vocaciones TI',
   'Exploración de áreas: desarrollo, ciberseguridad, datos e inteligencia artificial.',
   '2026-06-10', 'FUTURO', 4),

  ('Graduación y Cierre MMT 2026',
   'Ceremonia de cierre, entrega de certificados y networking con la industria.',
   '2026-07-15', 'FUTURO', 5);

COMMIT;
