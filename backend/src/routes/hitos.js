/*
 * ============================================================
 * routes/hitos.js
 * ============================================================
 * BASE URL: /api/hitos
 *
 *   GET    /api/hitos        → listar (público)
 *   POST   /api/hitos        → crear (ADMIN)
 *   PATCH  /api/hitos/:id    → actualizar (ADMIN)
 *   DELETE /api/hitos/:id    → eliminar (ADMIN)
 */

const router    = require('express').Router()
const hitoCtrl  = require('../controllers/hitoController')
const { verificarSesion, verificarRol } = require('../middleware/auth')

router.get('/', hitoCtrl.listar)

router.post('/',          verificarSesion, verificarRol('ADMIN'), hitoCtrl.crear)
router.patch('/:id',      verificarSesion, verificarRol('ADMIN'), hitoCtrl.actualizar)
router.delete('/:id',     verificarSesion, verificarRol('ADMIN'), hitoCtrl.eliminar)
router.get('/:id/tareas', verificarSesion,                        hitoCtrl.listarTareas)

module.exports = router
