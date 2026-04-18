/*
 * ============================================================
 * server.js  —  Punto de entrada del servidor MMT Valpo Hub
 * ============================================================
 *
 * Este archivo arranca la aplicación Express y conecta todos
 * los módulos del backend.
 *
 * ESTRUCTURA DE RUTAS:
 *   /api/auth/registrar   → crear cuenta
 *   /api/auth/login       → iniciar sesión
 *   /api/auth/yo          → perfil propio (requiere token)
 *   /api/materiales       → repositorio de materiales
 *   /api/asignaturas      → listado de asignaturas
 *   /uploads/:archivo     → archivos subidos (acceso directo)
 *   /api/salud            → verificar que el servidor está vivo
 *
 * VARIABLES DE ENTORNO (ver .env.example):
 *   PORT         → puerto del servidor (por defecto 3001)
 *   FRONTEND_URL → URL del frontend para CORS
 *   JWT_SECRET   → clave secreta para firmar tokens
 *   DB_*         → credenciales de PostgreSQL
 */

require('dotenv').config()

const express = require('express')
const cors    = require('cors')
const path    = require('path')

// --- Importamos todas las rutas ---
const rutasAuth        = require('./src/routes/auth')
const rutasMateriales  = require('./src/routes/materiales')
const rutasAsignaturas = require('./src/routes/asignaturas')
const rutasTareas      = require('./src/routes/tareas')
const rutasProyectos   = require('./src/routes/proyectos')
const rutasNoticias    = require('./src/routes/noticias')
const rutasHitos       = require('./src/routes/hitos')
const rutasSedes       = require('./src/routes/sedes')
const rutasAdmin       = require('./src/routes/admin')

const app  = express()
const PORT = process.env.PORT || 3001

// -------------------------------------------------------
// MIDDLEWARES GLOBALES
// (se aplican a TODAS las peticiones)
// -------------------------------------------------------

// CORS: permite que el frontend en localhost:5173 hable con el backend
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // necesario para enviar cookies o cabeceras de auth
}))

// Parsear cuerpos JSON en las peticiones
app.use(express.json())

// Servir archivos subidos de forma estática
// Ejemplo: GET http://localhost:3001/uploads/imagen.png
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// -------------------------------------------------------
// RUTAS DE LA APLICACIÓN
// -------------------------------------------------------

app.use('/api/auth',        rutasAuth)
app.use('/api/materiales',  rutasMateriales)
app.use('/api/asignaturas', rutasAsignaturas)
app.use('/api/tareas',      rutasTareas)
app.use('/api/proyectos',   rutasProyectos)
app.use('/api/noticias',    rutasNoticias)
app.use('/api/hitos',       rutasHitos)
app.use('/api/sedes',       rutasSedes)
app.use('/api/admin',       rutasAdmin)

// Estadísticas públicas para la landing
app.get('/api/estadisticas', async (_req, res) => {
  try {
    const { pool } = require('./src/config/db')
    const { rows: [data] } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM materiales)::integer                        AS materiales,
        (SELECT COUNT(*) FROM hitos)::integer                             AS hitos,
        (SELECT COUNT(*) FROM noticias WHERE publicada = TRUE)::integer   AS noticias,
        (SELECT COUNT(*) FROM proyectos WHERE estado IN ('APROBADO','FINALIZADO'))::integer AS proyectos
    `)
    res.json({ ok: true, ...data })
  } catch {
    res.status(500).json({ ok: false })
  }
})

// Ruta de verificación de salud del servidor
app.get('/api/salud', (_req, res) => {
  res.json({
    ok:      true,
    app:     'MMT Valpo Hub API',
    version: '1.0.0',
    fecha:   new Date().toISOString(),
  })
})

// -------------------------------------------------------
// MANEJADOR DE ERRORES GLOBAL
// -------------------------------------------------------
// Captura cualquier error no manejado en los controladores.
// En Express, un middleware con 4 parámetros es un error handler.

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, error.message)

  // Error de Multer (archivo muy grande o tipo no permitido)
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      ok: false,
      mensaje: 'El archivo supera el tamaño máximo permitido (10 MB).',
    })
  }

  // Error de tipo de archivo no permitido (lanzado en upload.js)
  if (error.message?.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({ ok: false, mensaje: error.message })
  }

  // Error genérico del servidor
  res.status(500).json({
    ok:      false,
    mensaje: 'Error interno del servidor. Intenta nuevamente.',
    // Solo mostramos detalles en desarrollo para no exponer info sensible
    detalle: process.env.NODE_ENV === 'development' ? error.message : undefined,
  })
})

// -------------------------------------------------------
// INICIAR SERVIDOR
// -------------------------------------------------------
app.listen(PORT, () => {
  console.log('')
  console.log('  ╔══════════════════════════════════════╗')
  console.log('  ║   MMT Valpo Hub  •  Backend API      ║')
  console.log(`  ║   http://localhost:${PORT}              ║`)
  console.log('  ╚══════════════════════════════════════╝')
  console.log('')
})
