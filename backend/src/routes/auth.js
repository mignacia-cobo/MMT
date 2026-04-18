/*
 * ============================================================
 * routes/auth.js  —  Rutas de autenticación
 * ============================================================
 *
 * Define las URLs relacionadas con registro, login y perfil.
 *
 * BASE URL: /api/auth
 *
 * Rutas disponibles:
 *   POST /api/auth/registrar  → crear cuenta nueva
 *   POST /api/auth/login      → iniciar sesión
 *   GET  /api/auth/yo         → obtener datos propios (requiere token)
 */

const router              = require('express').Router()
const authCtrl            = require('../controllers/authController')
const { verificarSesion } = require('../middleware/auth')
const { upload }          = require('../middleware/upload')

router.post('/registrar', authCtrl.registrar)
router.post('/login',     authCtrl.login)
router.get('/yo',         verificarSesion, authCtrl.yo)
router.patch('/perfil',   verificarSesion, authCtrl.actualizarPerfil)
router.patch('/avatar',   verificarSesion, upload.single('avatar'), authCtrl.actualizarAvatar)

module.exports = router
