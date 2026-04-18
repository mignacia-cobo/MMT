# 📋 Backlog de Desarrollo - MMT Valpo Hub

Este archivo contiene la hoja de ruta de implementación. Las tareas están ordenadas por dependencia técnica: Base de Datos → Backend → Frontend.

## Fase 1: Cimientos y Seguridad (Prioridad Alta)
- [ ] **DB:** Actualizar tabla `alumnas` para incluir el campo `rol` (ADMIN, LIDER, ALUMNA).
- [ ] **DB:** Crear tabla `proyectos` (id, nombre, descripcion, estado, id_lider).
- [ ] **DB:** Crear tabla `tareas` y `comentarios_tareas` para el registro de avance.
- [ ] **DB:** Agregar campo `rol` a tabla `alumnas`
  - Valores: ADMIN | LIDER | ALUMNA
  - Default: ALUMNA
  - Migración: /backend/migrations/001_add_rol_alumnas.sql
- [ ] **Auth:** Ajustar el middleware `verificarToken` para que soporte validación de Roles (RBAC).
- [ ] **Auth:** Crear el endpoint `GET /api/auth/yo` para devolver los permisos de la usuaria actual.

## Fase 2: Módulo de Tareas y Colaboración
- [ ] **Backend:** CRUD completo de tareas (Asignar, cambiar estado, eliminar).
- [ ] **Backend:** Endpoints para comentarios en tareas (`POST` y `GET` por ID de tarea).
- [ ] **Frontend:** Vista de Tablero Kanban con los colores institucionales (Morado/Celeste).
- [ ] **Frontend:** Modal de detalle de tarea que muestre el hilo de comentarios y registro de cierre.

## Fase 3: Postulación e Inscripción
- [ ] **Backend:** Endpoint de inscripción al programa (flujo inicial de registro de alumna).
- [ ] **Backend:** Endpoint de postulación de ideas (Ruta 3).
- [ ] **Frontend:** Formulario dinámico de postulación de proyectos con feedback de estado.

## Fase 4: Comunidad y Contenidos
- [ ] **Backend:** CRUD de noticias y lógica de comentarios/likes en el muro público.
- [ ] **Frontend:** Landing page pública con el feed de noticias y cronograma de hitos 2026.
- [ ] **Frontend:** Módulo de perfil de alumna con su historial de aportes y materiales.

## Fase 5: Panel de Administración (Sede Valparaíso)
- [ ] **Frontend:** Dashboard exclusivo para Rol ADMIN (María Ignacia) con métricas de participación por carrera.
- [ ] **Frontend:** Gestión de usuarias (subir/bajar roles de alumnas a Líderes de Ruta).