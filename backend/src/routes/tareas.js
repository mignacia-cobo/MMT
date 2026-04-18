/*
 * ============================================================
 * routes/tareas.js  —  Rutas del módulo de tareas
 * ============================================================
 *
 * BASE URL: /api/tareas
 *
 *   GET    /api/tareas                      → listar (con filtros opcionales)
 *   GET    /api/tareas/:id                  → detalle de una tarea
 *   POST   /api/tareas                      → crear  (ADMIN, LIDER)
 *   PATCH  /api/tareas/:id/estado           → cambiar estado
 *   DELETE /api/tareas/:id                  → eliminar (ADMIN, LIDER)
 *   GET    /api/tareas/:id/comentarios      → listar comentarios
 *   POST   /api/tareas/:id/comentarios      → agregar comentario
 */

const router                          = require('express').Router()
const tareaCtrl                       = require('../controllers/tareaController')
const { verificarSesion, verificarRol } = require('../middleware/auth')

// Rutas específicas ANTES de /:id para evitar colisiones
router.get('/alumnas',         verificarSesion,                                  tareaCtrl.listarAlumnas)

router.get('/',                verificarSesion,                                  tareaCtrl.listar)
router.get('/:id',             verificarSesion,                                  tareaCtrl.obtener)
router.post('/',               verificarSesion, verificarRol('ADMIN', 'LIDER'),  tareaCtrl.crear)

router.patch('/:id',           verificarSesion,                                  tareaCtrl.actualizar)
router.patch('/:id/estado',    verificarSesion,                                  tareaCtrl.cambiarEstado)
router.patch('/:id/asignar',   verificarSesion, verificarRol('ADMIN', 'LIDER'),  tareaCtrl.asignar)
router.patch('/:id/proyecto',  verificarSesion, verificarRol('ADMIN', 'LIDER'),  tareaCtrl.asignarProyecto)
router.delete('/:id',          verificarSesion, verificarRol('ADMIN', 'LIDER'),  tareaCtrl.eliminar)

router.get('/:id/comentarios',  verificarSesion, tareaCtrl.listarComentarios)
router.post('/:id/comentarios', verificarSesion, tareaCtrl.agregarComentario)

module.exports = router
