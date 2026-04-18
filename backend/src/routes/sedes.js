const router    = require('express').Router()
const sedeCtrl  = require('../controllers/sedeController')
const { verificarSesion, verificarRol } = require('../middleware/auth')

router.get('/',       sedeCtrl.listarActivas)
router.post('/',      verificarSesion, verificarRol('ADMIN'), sedeCtrl.crear)
router.patch('/:id',  verificarSesion, verificarRol('ADMIN'), sedeCtrl.actualizar)
router.delete('/:id', verificarSesion, verificarRol('ADMIN'), sedeCtrl.eliminar)

module.exports = router
