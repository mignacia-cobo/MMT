/*
 * ============================================================
 * routes/materiales.js  —  Rutas del repositorio de materiales
 * ============================================================
 *
 * BASE URL: /api/materiales
 *
 * Rutas disponibles:
 *   GET    /api/materiales              → listar con filtros opcionales
 *   GET    /api/materiales/:id          → obtener uno en detalle
 *   POST   /api/materiales              → subir nuevo (requiere sesión)
 *   GET    /api/materiales/:id/descargar → descargar archivo
 *   DELETE /api/materiales/:id          → eliminar (solo la autora)
 */

const router              = require('express').Router()
const materialCtrl        = require('../controllers/materialController')
const { upload }          = require('../middleware/upload')
const { verificarSesion } = require('../middleware/auth')

// Listar materiales — pública
router.get('/', materialCtrl.listar)

// Ver un material — pública
router.get('/:id', materialCtrl.obtener)

// Subir nuevo material — requiere sesión + archivo
// verificarSesion verifica el token, luego upload procesa el archivo
router.post('/', verificarSesion, upload.single('archivo'), materialCtrl.crear)

// Descargar archivo — pública
router.get('/:id/descargar', materialCtrl.descargar)

// Actualizar código HTML — requiere sesión (solo la autora)
router.patch('/:id/codigo', verificarSesion, materialCtrl.actualizarCodigo)

// Eliminar material — requiere sesión (solo la autora puede borrar)
router.delete('/:id', verificarSesion, materialCtrl.eliminar)

module.exports = router
