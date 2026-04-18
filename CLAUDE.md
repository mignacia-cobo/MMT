# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MMT Valpo Hub — plataforma de gestión académica y continuidad para alumnas del programa MMT de Duoc UC Valparaíso. Stack: React 18 + Tailwind (frontend), Express + PostgreSQL (backend).

**Tres niveles de acceso (RBAC):**
- **ADMIN** — gestión total: usuarias, roles, sedes, noticias, hitos, aprobación de proyectos.
- **LIDER** — gestión de tareas y proyectos dentro de su ruta asignada (LIDERAZGO, VOCACION, PROYECTOS).
- **ALUMNA** — acceso a materiales, postulación de proyectos, inscripción a tareas y perfil personal.

## Commands

### Frontend (`/frontend`)
```bash
npm run dev      # Dev server → http://localhost:5173
npm run build    # Production build
npm run preview  # Preview built output
```

### Backend (`/backend`)
```bash
npm run dev      # Nodemon dev server → http://localhost:3001
npm start        # Production start
npm run semilla  # Seed con datos de prueba (alumnas + asignaturas + materiales)
```

Seed de demostración (cuentas admin y líder con hitos/tareas/proyectos):
```bash
docker exec -it postgres_mmt psql -U postgres -d mmt_valpo -f /seeds/seed_demo.sql
```

Vite proxea `/api` y `/uploads` a `http://localhost:3001` — correr ambos servidores en desarrollo.

### Base de datos (Docker)
```bash
docker exec -it postgres_mmt psql -U postgres -d mmt_valpo
```

El backend requiere `.env` (ver `.env.example`). Variables clave: `JWT_SECRET`, `DB_*`, `PORT=3001`, `FRONTEND_URL`.

## Architecture

### Frontend
- **Entry:** `src/main.jsx` → `src/App.jsx` (React Router 6 + `SesionProvider`)
- **Rutas:** `/login`, `/` (Home/Dashboard/Landing), `/noticias`, `/materiales`, `/tareas`, `/proyectos`, `/perfil`, `/admin`, `/admin/cronograma`
- **Estado global:** Context API via `SesionContext` — expone `alumna`, `login`, `logout`, `cargando`
  - `alumna` contiene: `{ id, nombre, email, carrera, anio_cohorte, avatar_url, rol, ruta_asignada, id_sede, nombre_sede, creado_en }`
  - Token persiste en `localStorage('mmt_token')`; se valida contra `/api/auth/yo` al recargar
- **HTTP:** `apiFetch(ruta, opciones)` en `src/hooks/useApi.js` — inyecta JWT automáticamente, lanza error si `!respuesta.ok`. Hook `useApi(ruta, { deps, params })` para carga automática.
- **Estilos:** Tailwind con tema custom (`mmt-purple #6B21A8`, `mmt-celeste #38BDF8`); clases utilitarias en `index.css` (`.btn-primary`, `.btn-outline`, `.input-field`, `.card`)

### Backend
- **Entry:** `backend/server.js` — monta middlewares y todos los archivos de rutas
- **Patrón:** MVC — `routes/` → `controllers/` → `models/` (queries con `pg` pool, sin ORM)
- **Auth:** JWT 7 días. `verificarSesion` adjunta `req.usuaria = { id, nombre, email, rol, ruta_asignada, id_sede }`. `verificarRol(...roles)` devuelve 403 si el rol no está permitido. `verificarSesionOpcional` no bloquea si no hay token.
- **Subida de archivos:** Multer guarda en `backend/uploads/`. Whitelist: pdf, imágenes, código, zip. Límite 10 MB. Servido estático en `/uploads/*`.
- **Respuestas:** Siempre `{ ok: boolean, ...datos }` — nunca lanzar datos sin el campo `ok`.

### Esquema de base de datos (PostgreSQL)

| Tabla | Columnas clave |
|---|---|
| `alumnas` | id, nombre, email, password_hash, carrera, anio_cohorte, avatar_url, rol (ADMIN\|LIDER\|ALUMNA), ruta_asignada, id_sede, creado_en |
| `asignaturas` | id, nombre, codigo, descripcion, activa |
| `materiales` | id, titulo, descripcion, nombre_archivo, url_archivo, tipo_archivo, tamano_bytes, descargas, codigo_html, id_asignatura, id_alumna, creado_en |
| `proyectos` | id, nombre, descripcion, estado (PENDIENTE\|EN_REVISION\|APROBADO\|FINALIZADO), ruta, id_lider, id_postulante, id_sede, creado_en |
| `proyecto_asignadas` | id_proyecto, id_alumna (PK compuesto) |
| `tareas` | id, titulo, descripcion, prioridad (ALTA\|MEDIA\|BAJA), estado (PENDIENTE\|EN_PROGRESO\|COMPLETADA), ruta, lecciones, id_creada_por, id_proyecto, id_hito, id_sede, fecha_limite, creado_en, actualizado_en |
| `tarea_asignadas` | id_tarea, id_alumna (PK compuesto) |
| `comentarios_tareas` | id, id_tarea, id_alumna, contenido, creado_en |
| `noticias` | id, titulo, contenido, imagen_url, publicada, id_autora, id_sede, creado_en, actualizado_en |
| `comentarios_noticias` | id, id_noticia, id_alumna, contenido, creado_en |
| `likes_noticias` | id_noticia, id_alumna (PK compuesto) |
| `hitos` | id, titulo, descripcion, fecha, tipo (PASADO\|ACTUAL\|FUTURO), orden |
| `sedes` | id, nombre, ciudad, activa, creado_en |
| `admin_sedes` | id_admin, id_sede (PK compuesto) — si un admin no tiene registros aquí, ve todas las sedes |

**Vista:** `vista_materiales_completa` — JOIN de materiales + asignaturas + alumnas. Usada por `Material.buscarPorId()`.

**Migraciones:** `backend/migrations/000` a `012`. Nunca modificar schema sin crear una nueva migración numerada.

### API endpoints completos

```
# Auth
POST   /api/auth/registrar              body: { nombre, email, password, carrera?, idSede? }
POST   /api/auth/login                  body: { email, password }
GET    /api/auth/yo                     🔒 sesión → alumna completa con nombre_sede
PATCH  /api/auth/perfil                🔒 body: { nombre?, carrera? } — auto-edición
PATCH  /api/auth/avatar                🔒 multipart/form-data campo "avatar" — sube imagen de perfil

# Materiales
GET    /api/materiales                  ?asignatura=&busqueda=&pagina=&limite=&id_alumna=
GET    /api/materiales/:id
POST   /api/materiales                  🔒 multipart/form-data (archivo + campos)
GET    /api/materiales/:id/descargar    incrementa contador
PATCH  /api/materiales/:id/codigo       🔒 solo autora, body: { codigo_html }
DELETE /api/materiales/:id              🔒 autora O ADMIN (respeta restricción de sede del admin)

# Asignaturas
GET    /api/asignaturas                 solo activas

# Tareas
GET    /api/tareas                      🔒 ?ruta=&estado= (filtrado por id_sede del usuario)
GET    /api/tareas/alumnas              🔒 alumnas asignables (filtradas por sede)
GET    /api/tareas/:id                  🔒
POST   /api/tareas                      🔒 ADMIN|LIDER, body: { titulo, prioridad, ruta, descripcion?, idsAsignadas?, idProyecto?, idHito?, fechaLimite? }
PATCH  /api/tareas/:id                  🔒 creadora/asignada/ADMIN — body incluye idCreadaPor (solo ADMIN)
PATCH  /api/tareas/:id/estado           🔒 body: { estado, lecciones? } — lecciones obligatorio si estado=COMPLETADA
PATCH  /api/tareas/:id/asignar          🔒 ADMIN|LIDER, body: { idsAlumnas: number[] }
PATCH  /api/tareas/:id/proyecto         🔒 ADMIN|LIDER, body: { idProyecto }
DELETE /api/tareas/:id                  🔒 ADMIN|LIDER
GET    /api/tareas/:id/comentarios      🔒
POST   /api/tareas/:id/comentarios      🔒 body: { contenido }

# Proyectos
GET    /api/proyectos                   🔒 ?ruta=&estado= (filtrado por rol)
GET    /api/proyectos/alumnas           🔒 ADMIN|LIDER
GET    /api/proyectos/:id               🔒
POST   /api/proyectos                   🔒 cualquier rol, body: { nombre, descripcion?, ruta }
PATCH  /api/proyectos/:id               🔒 postulante/miembros/ADMIN
PATCH  /api/proyectos/:id/estado        🔒 ADMIN, body: { estado }
PATCH  /api/proyectos/:id/lider         🔒 ADMIN, body: { idLider }
PATCH  /api/proyectos/:id/postulante    🔒 ADMIN, body: { idPostulante } — cambia la creadora/postulante
PATCH  /api/proyectos/:id/asignar       🔒 ADMIN|LIDER, body: { idsAlumnas: number[] }
DELETE /api/proyectos/:id               🔒 ADMIN (respeta restricción de sede)
GET    /api/proyectos/:id/tareas        🔒

# Noticias
GET    /api/noticias                    público, ?sede= (si alumna autenticada, filtra por su sede automáticamente)
GET    /api/noticias/:id                público + me_gusta si hay token
POST   /api/noticias                    🔒 ADMIN, body: { titulo, contenido, imagenUrl?, idSede? } — crea sin publicar
PATCH  /api/noticias/:id                🔒 ADMIN, body: { titulo?, contenido?, imagenUrl?, publicada?, idSede? }
DELETE /api/noticias/:id                🔒 ADMIN
POST   /api/noticias/:id/like           🔒 toggle like
GET    /api/noticias/:id/comentarios    público
POST   /api/noticias/:id/comentarios    🔒 body: { contenido }

# Hitos
GET    /api/hitos                       público, ?conTareas=1 incluye tareas por hito
POST   /api/hitos                       🔒 ADMIN
PATCH  /api/hitos/:id                   🔒 ADMIN
DELETE /api/hitos/:id                   🔒 ADMIN
GET    /api/hitos/:id/tareas            🔒

# Sedes
GET    /api/sedes                       público — solo sedes ACTIVAS (para dropdowns/registro)
POST   /api/sedes                       🔒 ADMIN
PATCH  /api/sedes/:id                   🔒 ADMIN, body: { nombre?, ciudad?, activa? }
DELETE /api/sedes/:id                   🔒 ADMIN

# Admin
GET    /api/admin/sedes                 🔒 ADMIN — todas las sedes incluyendo inactivas
GET    /api/admin/usuarias              🔒 ADMIN (filtrado por admin_sedes si aplica)
POST   /api/admin/usuarias              🔒 ADMIN, body: { nombre, email, password, carrera?, rol?, idSede?, rutaAsignada? }
PATCH  /api/admin/usuarias/:id/rol      🔒 ADMIN, body: { rol, rutaAsignada? }
PATCH  /api/admin/usuarias/:id/sede     🔒 ADMIN, body: { idSede }
PATCH  /api/admin/usuarias/:id          🔒 ADMIN, body: { nombre?, email?, carrera?, anioCohorte? }
DELETE /api/admin/usuarias/:id          🔒 ADMIN (no puede eliminarse a sí misma)
GET    /api/admin/metricas              🔒 ADMIN → { totales, porCarrera, porSede }
GET    /api/admin/usuarias/:id/permisos 🔒 ADMIN → array de id_sede permitidas
PUT    /api/admin/usuarias/:id/permisos 🔒 ADMIN, body: { sedeIds: number[] }
GET    /api/admin/noticias              🔒 ADMIN — todas incluyendo borradores (filtrado por admin_sedes)
GET    /api/admin/asignaturas          🔒 ADMIN — todas incluyendo inactivas, con total_materiales
POST   /api/admin/asignaturas          🔒 ADMIN, body: { nombre, codigo?, descripcion? }
PATCH  /api/admin/asignaturas/:id      🔒 ADMIN, body: { nombre?, codigo?, descripcion?, activa? }

# Utilidad
GET    /api/estadisticas    público — conteos: materiales, hitos, noticias publicadas, proyectos activos
GET    /api/salud
```

## Conventions

- Código y comentarios en **español** (variables, UI, mensajes de error).
- Queries SQL siempre con placeholders parametrizados (`$1, $2`) — nunca interpolación de strings.
- Rutas protegidas usan `verificarSesion` importado de `src/middleware/auth.js`.
- `verificarRol('ADMIN', 'LIDER')` siempre va **después** de `verificarSesion` en la cadena.
- Componentes frontend en `src/components/` (reutilizables) o `src/pages/` (nivel de ruta); no mezclar.
- Al agregar un campo nuevo a `alumnas` o cualquier tabla, actualizar también `generarToken()` en `auth.js` si el campo debe estar en el JWT.

## Reglas de Desarrollo

- **Nunca modificar schema sin crear migración SQL** en `/backend/migrations/` con número correlativo.
- Los roles válidos son exactamente: `ADMIN`, `LIDER`, `ALUMNA`.
- Las rutas válidas son exactamente: `LIDERAZGO`, `VOCACION`, `PROYECTOS`.
- **Siempre validar rol en backend**, nunca confiar solo en el frontend.
- `id_sede` se hereda del creador en tareas, proyectos y noticias — nunca confiar en el body del cliente para esto.
- Al crear una alumna (registro o admin), `id_sede` debe incluirse en el INSERT y en el RETURNING vía `buscarPorId()`.
- El endpoint público `GET /api/sedes` devuelve solo sedes activas. Para gestión admin usar `GET /api/admin/sedes`.
- Permisos multi-sede: si un ADMIN no tiene registros en `admin_sedes`, ve **todo**. Si tiene registros, solo ve esas sedes.

## Estado Actual

### Funcionando al 100%

- **Autenticación** — registro (con selección de sede), login, JWT 7 días, `verificarSesion`, `verificarSesionOpcional`, sesión persistida en localStorage, restauración automática via `/api/auth/yo`
- **RBAC / Roles** — campo `rol` en `alumnas`, middleware `verificarRol`, tres niveles ADMIN/LIDER/ALUMNA completamente operativos
- **Materiales** — subir (Multer, 10 MB), listar con paginación y filtros, buscar, descargar con contador, eliminar (solo autora), código HTML interactivo opcional
- **Tareas / Kanban** — CRUD completo, asignación múltiple (N:N via `tarea_asignadas`), 3 rutas × 3 estados, comentarios, lecciones aprendidas obligatorias al completar, asociación a proyectos e hitos, fecha límite, filtrado por sede
- **Proyectos** — postulación por ALUMNA, flujo de estados (PENDIENTE→FINALIZADO), asignación de líder y miembros (N:N), tareas por proyecto, filtrado por rol y sede
- **Noticias** — feed público, likes/unlike, comentarios, publicar/despublicar (ADMIN), filtro automático por sede del usuario autenticado
- **Hitos del Cronograma** — CRUD (ADMIN), tipos PASADO/ACTUAL/FUTURO, orden manual, asociación a tareas, vista con tareas por hito
- **Sistema de Sedes** — CRUD de sedes (ADMIN), permisos multi-sede para admins (`admin_sedes`), `id_sede` propagado en JWT y en todo el contenido (tareas, proyectos, noticias, alumnas)
- **Panel Admin** — 5 pestañas: Usuarios (CRUD inline), Sedes (CRUD), Asignaturas (CRUD + toggle activa), Cronograma (reutiliza `PlanificadorCronograma`), Noticias (crear/publicar/eliminar); métricas globales

### Parcial / Mejoras pendientes

- **Perfil** — edición de nombre/carrera funcional; avatar upload funcional; sin cambio de sede propia (solo admin puede reasignar sedes)

### No implementado (fuera del scope actual)

- **Muro de Comunidad** — microblogging entre alumnas
- **Notificaciones en tiempo real** — WebSockets o SSE
- **Tests** — sin cobertura de pruebas automatizadas
