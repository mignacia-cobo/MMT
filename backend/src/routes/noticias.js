/*
 * ============================================================
 * routes/noticias.js
 * ============================================================
 * BASE URL: /api/noticias
 *
 *   GET    /api/noticias                   → listar publicadas (público)
 *   GET    /api/noticias/:id               → detalle (meGusta si hay token)
 *   POST   /api/noticias                   → crear (ADMIN)
 *   PATCH  /api/noticias/:id               → actualizar/publicar (ADMIN)
 *   DELETE /api/noticias/:id               → eliminar (ADMIN)
 *   POST   /api/noticias/:id/like          → toggle like (autenticada)
 *   GET    /api/noticias/:id/comentarios   → listar (público)
 *   POST   /api/noticias/:id/comentarios   → agregar (autenticada)
 */

const router        = require('express').Router()
const noticiaCtrl   = require('../controllers/noticiaController')
const { verificarSesion, verificarRol, verificarSesionOpcional } = require('../middleware/auth')
const { upload }    = require('../middleware/upload')

// Públicos (con token opcional para meGusta)
router.get('/',    verificarSesionOpcional, noticiaCtrl.listar)
router.get('/:id', verificarSesionOpcional, noticiaCtrl.obtener)

// Admin
router.post('/',      verificarSesion, verificarRol('ADMIN'), noticiaCtrl.crear)
router.patch('/:id',  verificarSesion, noticiaCtrl.actualizar)   // ADMIN o autora
router.delete('/:id', verificarSesion, noticiaCtrl.eliminar)     // ADMIN o autora

// Imagen de noticia (ADMIN)
router.post('/:id/imagen', verificarSesion, verificarRol('ADMIN'), upload.single('imagen'), noticiaCtrl.subirImagen)

// Autenticadas
router.post('/:id/like',         verificarSesion, noticiaCtrl.toggleLike)
router.post('/:id/comentarios',  verificarSesion, noticiaCtrl.agregarComentario)

// Público
router.get('/:id/comentarios', noticiaCtrl.listarComentarios)

module.exports = router
