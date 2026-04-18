/*
 * ============================================================
 * routes/proyectos.js  —  Rutas del módulo de proyectos
 * ============================================================
 *
 * BASE URL: /api/proyectos
 *
 *   GET    /api/proyectos              → listar (filtro automático por rol)
 *   GET    /api/proyectos/:id          → detalle de un proyecto
 *   POST   /api/proyectos              → postular proyecto (cualquier usuaria)
 *   PATCH  /api/proyectos/:id/estado   → cambiar estado (ADMIN)
 *   PATCH  /api/proyectos/:id/lider    → asignar líder  (ADMIN)
 */

const router                          = require('express').Router()
const proyectoCtrl                    = require('../controllers/proyectoController')
const { verificarSesion, verificarRol } = require('../middleware/auth')

// Rutas específicas ANTES de /:id
router.get('/alumnas',  verificarSesion, verificarRol('ADMIN', 'LIDER'), proyectoCtrl.listarAlumnas)

router.get('/',    verificarSesion, proyectoCtrl.listar)
router.get('/:id', verificarSesion, proyectoCtrl.obtener)
router.post('/',   verificarSesion, proyectoCtrl.postular)
router.patch('/:id', verificarSesion, proyectoCtrl.actualizar)

router.get('/:id/tareas',         verificarSesion,                                 proyectoCtrl.listarTareas)
router.patch('/:id/estado',       verificarSesion, verificarRol('ADMIN'),          proyectoCtrl.actualizarEstado)
router.patch('/:id/lider',        verificarSesion, verificarRol('ADMIN'),          proyectoCtrl.asignarLider)
router.patch('/:id/postulante',   verificarSesion, verificarRol('ADMIN'),          proyectoCtrl.actualizarPostulante)
router.patch('/:id/asignar',      verificarSesion, verificarRol('ADMIN', 'LIDER'), proyectoCtrl.asignarMiembros)
router.delete('/:id',             verificarSesion, verificarRol('ADMIN'),          proyectoCtrl.eliminar)

module.exports = router
