-- =============================================================
-- seed_demo.sql — Datos de demostración MMT Valpo Hub
-- =============================================================
-- Ejecutar: psql -U postgres -d mmt_valpo -f backend/seeds/seed_demo.sql
-- Requiere: pgcrypto (se habilita en este script)
--
-- Este script es idempotente: borra y recrea solo los datos demo.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Limpiar datos demo previos (orden respeta FK — hijos antes que padres)
DELETE FROM comentarios_noticias
  WHERE id_alumna IN (SELECT id FROM alumnas WHERE email IN ('admin@mmt.cl', 'lider@mmt.cl'));
DELETE FROM likes_noticias
  WHERE id_alumna IN (SELECT id FROM alumnas WHERE email IN ('admin@mmt.cl', 'lider@mmt.cl'));
DELETE FROM noticias
  WHERE id_autora IN (SELECT id FROM alumnas WHERE email IN ('admin@mmt.cl', 'lider@mmt.cl'));
DELETE FROM hitos;
DELETE FROM comentarios_tareas
  WHERE id_alumna IN (SELECT id FROM alumnas WHERE email IN ('admin@mmt.cl', 'lider@mmt.cl'));
DELETE FROM tareas
  WHERE id_creada_por IN (SELECT id FROM alumnas WHERE email IN ('admin@mmt.cl', 'lider@mmt.cl'));
DELETE FROM proyectos
  WHERE id_lider IN (SELECT id FROM alumnas WHERE email IN ('admin@mmt.cl', 'lider@mmt.cl'))
     OR id_lider IS NULL;
DELETE FROM alumnas WHERE email IN ('admin@mmt.cl', 'lider@mmt.cl');

-- ============================================================
-- SEDES
-- ============================================================

INSERT INTO sedes (nombre, ciudad) VALUES
  ('Sede Valparaíso', 'Valparaíso')
ON CONFLICT DO NOTHING;

-- ============================================================
-- USUARIAS
-- ============================================================

INSERT INTO alumnas (nombre, email, password_hash, carrera, rol, anio_cohorte, id_sede) VALUES
  ('María Ignacia Coordinadora',
   'admin@mmt.cl',
   crypt('admin123', gen_salt('bf', 10)),
   'Coordinación MMT Valparaíso',
   'ADMIN', 2026,
   (SELECT id FROM sedes WHERE ciudad = 'Valparaíso' LIMIT 1)),

  ('Valentina Leal',
   'lider@mmt.cl',
   crypt('lider123', gen_salt('bf', 10)),
   'Ing. en Computación e Informática',
   'LIDER', 2024,
   (SELECT id FROM sedes WHERE ciudad = 'Valparaíso' LIMIT 1));

-- ============================================================
-- TAREAS (10 total: 3 PENDIENTE, 4 EN_PROGRESO, 3 COMPLETADA)
-- ============================================================

INSERT INTO tareas (titulo, descripcion, prioridad, estado, ruta, id_creada_por, id_asignada_a, lecciones) VALUES

  -- LIDERAZGO -----------------------------------------------

  ('Taller de comunicación efectiva',
   'Técnicas de presentación oral y escucha activa para equipos de trabajo.',
   'ALTA', 'COMPLETADA', 'LIDERAZGO',
   (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl'),
   (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl'),
   'La escucha activa es tan importante como hablar. Parafrasear al interlocutor evita el 80% de los malentendidos.'),

  ('Mentoría 1:1 con profesional del área',
   'Sesión con mentora invitada de la industria tecnológica local.',
   'ALTA', 'COMPLETADA', 'LIDERAZGO',
   (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl'),
   NULL,
   'Aprendí a documentar mis logros con métricas. La mentora sugirió llevar un diario de victorias semanales.'),

  ('Dinámica de resolución de conflictos',
   'Workshop grupal con caso práctico basado en escenarios reales de equipos TI.',
   'MEDIA', 'EN_PROGRESO', 'LIDERAZGO',
   (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl'),
   NULL, NULL),

  ('Presentación de proyecto a directivos',
   'Pitch de 5 minutos ante panel evaluador. Requiere deck en Canva y demo funcional.',
   'ALTA', 'PENDIENTE', 'LIDERAZGO',
   (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl'),
   (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl'),
   NULL),

  -- VOCACION ------------------------------------------------

  ('Charla: Mujeres en Ciberseguridad',
   'Panelistas de empresas del sector comparten su trayectoria y consejos.',
   'MEDIA', 'COMPLETADA', 'VOCACION',
   (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl'),
   NULL,
   'Descubrí que el área GRC (Gobierno, Riesgo y Cumplimiento) tiene alta demanda y poca competencia.'),

  ('Visita técnica a empresa tecnológica',
   'Tour y sesión Q&A con el equipo de ingeniería de empresa socia del programa.',
   'ALTA', 'EN_PROGRESO', 'VOCACION',
   (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl'),
   NULL, NULL),

  ('Exploración vocacional: IA vs Desarrollo Web',
   'Taller con ejercicios prácticos para identificar área de especialización.',
   'MEDIA', 'PENDIENTE', 'VOCACION',
   (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl'),
   NULL, NULL),

  -- PROYECTOS -----------------------------------------------

  ('Definición del problema y diagnóstico',
   'Diagnóstico con encuesta a usuarias reales. Mínimo 10 respuestas válidas.',
   'ALTA', 'COMPLETADA', 'PROYECTOS',
   (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl'),
   (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl'),
   'El problema real era diferente al que asumíamos. Las entrevistas revelaron que la barrera es motivacional, no de acceso.'),

  ('Desarrollo del MVP',
   'Primera versión funcional. Incluye autenticación, módulo principal y diseño responsive.',
   'ALTA', 'EN_PROGRESO', 'PROYECTOS',
   (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl'),
   (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl'),
   NULL),

  ('Preparación Demo Day 2026',
   'Pitch de 8 minutos con demo en vivo y sesión de preguntas ante jurado externo.',
   'ALTA', 'PENDIENTE', 'PROYECTOS',
   (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl'),
   NULL, NULL);

-- ============================================================
-- PROYECTOS
-- ============================================================

INSERT INTO proyectos (nombre, descripcion, estado, id_lider) VALUES
  ('App de Orientación Vocacional STEM',
   'Aplicación que ayuda a estudiantes de enseñanza media a explorar carreras STEM mediante tests y testimonios de profesionales.',
   'APROBADO',
   (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl')),

  ('Plataforma de Tutoría entre Pares',
   'Sistema de apoyo académico entre alumnas de distintos años para reforzar materias críticas del primer ciclo.',
   'EN_REVISION',
   (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl')),

  ('Asistente IA para Debugging',
   'Herramienta que ayuda a alumnas principiantes a entender errores de código con explicaciones en lenguaje simple.',
   'PENDIENTE',
   NULL);

-- ============================================================
-- COMENTARIOS EN TAREAS
-- ============================================================

INSERT INTO comentarios_tareas (id_tarea, id_alumna, contenido) VALUES

  ((SELECT id FROM tareas WHERE titulo = 'Dinámica de resolución de conflictos'),
   (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl'),
   'Recuerden traer el caso práctico impreso. Trabajaremos en grupos de 4 personas.'),

  ((SELECT id FROM tareas WHERE titulo = 'Dinámica de resolución de conflictos'),
   (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl'),
   'Confirmado. Coordiné la sala D-204 para el jueves a las 15:00.'),

  ((SELECT id FROM tareas WHERE titulo = 'Desarrollo del MVP'),
   (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl'),
   'El módulo de autenticación quedó listo. Esta semana termino el kanban y lo conecto a la API.'),

  ((SELECT id FROM tareas WHERE titulo = 'Desarrollo del MVP'),
   (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl'),
   '¡Excelente avance! No olvides documentar los endpoints antes del Demo Day.'),

  ((SELECT id FROM tareas WHERE titulo = 'Presentación de proyecto a directivos'),
   (SELECT id FROM alumnas WHERE email = 'admin@mmt.cl'),
   'La fecha es el 15 de mayo a las 15:00 h. Máximo 5 min de pitch + 3 min de preguntas.'),

  ((SELECT id FROM tareas WHERE titulo = 'Visita técnica a empresa tecnológica'),
   (SELECT id FROM alumnas WHERE email = 'lider@mmt.cl'),
   'Confirmen asistencia antes del lunes. Cupo máximo: 12 alumnas.');

COMMIT;
