const router    = require('express').Router()
const adminCtrl = require('../controllers/adminController')
const sedeCtrl  = require('../controllers/sedeController')
const { verificarSesion, verificarRol } = require('../middleware/auth')

const soloAdmin = [verificarSesion, verificarRol('ADMIN')]

router.get('/usuarias',                    ...soloAdmin, adminCtrl.listarUsuarias)
router.post('/usuarias',                   ...soloAdmin, adminCtrl.crearUsuaria)
router.patch('/usuarias/:id/rol',          ...soloAdmin, adminCtrl.actualizarRol)
router.patch('/usuarias/:id/sede',         ...soloAdmin, adminCtrl.actualizarSede)
router.patch('/usuarias/:id',              ...soloAdmin, adminCtrl.actualizarUsuaria)
router.delete('/usuarias/:id',             ...soloAdmin, adminCtrl.eliminarUsuaria)
router.get('/metricas',                    ...soloAdmin, adminCtrl.metricas)
router.get('/usuarias/:id/permisos',       ...soloAdmin, adminCtrl.listarPermisosAdmin)
router.put('/usuarias/:id/permisos',       ...soloAdmin, adminCtrl.actualizarPermisosAdmin)
router.get('/noticias',                    ...soloAdmin, adminCtrl.listarNoticias)
router.get('/sedes',                       ...soloAdmin, sedeCtrl.listar)
router.get('/asignaturas',                 ...soloAdmin, adminCtrl.listarAsignaturas)
router.post('/asignaturas',                ...soloAdmin, adminCtrl.crearAsignatura)
router.patch('/asignaturas/:id',           ...soloAdmin, adminCtrl.actualizarAsignatura)

module.exports = router
