/*
 * ============================================================
 * controllers/noticiaController.js  —  Lógica de noticias MMT
 * ============================================================
 *
 * RUTAS:
 *   GET    /api/noticias                     → listar publicadas (público)
 *   GET    /api/noticias/:id                 → detalle (público, meGusta si hay token)
 *   POST   /api/noticias                     → crear (ADMIN)
 *   PATCH  /api/noticias/:id                 → actualizar/publicar (ADMIN)
 *   DELETE /api/noticias/:id                 → eliminar (ADMIN)
 *   POST   /api/noticias/:id/like            → toggle like (autenticada)
 *   GET    /api/noticias/:id/comentarios     → listar (público)
 *   POST   /api/noticias/:id/comentarios     → agregar (autenticada)
 */

const Noticia = require('../models/Noticia')

exports.listar = async (req, res) => {
  try {
    // Filtro opcional por sede via query param ?sede=X  (decidido en el frontend)
    const idSede = req.query.sede ? Number(req.query.sede) : null
    const noticias = await Noticia.listar({ idSede })
    res.json({ ok: true, noticias })
  } catch (error) {
    console.error('Error en noticias.listar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener las noticias.' })
  }
}

exports.obtener = async (req, res) => {
  try {
    const idAlumna = req.usuaria?.id ?? null
    const noticia  = await Noticia.buscarPorId(req.params.id, idAlumna)
    if (!noticia) {
      return res.status(404).json({ ok: false, mensaje: 'Noticia no encontrada.' })
    }
    res.json({ ok: true, noticia })
  } catch (error) {
    console.error('Error en noticias.obtener:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener la noticia.' })
  }
}

exports.crear = async (req, res) => {
  try {
    const { titulo, contenido, imagenUrl } = req.body
    if (!titulo?.trim())    return res.status(400).json({ ok: false, mensaje: 'El título es obligatorio.' })
    if (!contenido?.trim()) return res.status(400).json({ ok: false, mensaje: 'El contenido es obligatorio.' })

    const noticia = await Noticia.crear({
      titulo:    titulo.trim(),
      contenido: contenido.trim(),
      imagenUrl: imagenUrl ?? null,
      idAutora:  req.usuaria.id,
      idSede:    req.body.idSede ?? req.usuaria.id_sede ?? null,
    })
    res.status(201).json({ ok: true, noticia })
  } catch (error) {
    console.error('Error en noticias.crear:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al crear la noticia.' })
  }
}

async function verificarPropietaria(req, res) {
  const noticia = await Noticia.buscarPorId(req.params.id, null)
  if (!noticia) { res.status(404).json({ ok: false, mensaje: 'Noticia no encontrada.' }); return null }
  const esAdmin  = req.usuaria.rol === 'ADMIN'
  const esAutora = noticia.id_autora === req.usuaria.id
  if (!esAdmin && !esAutora) {
    res.status(403).json({ ok: false, mensaje: 'Solo la autora o un administrador puede realizar esta acción.' })
    return null
  }
  return noticia
}

exports.actualizar = async (req, res) => {
  try {
    const base = await verificarPropietaria(req, res)
    if (!base) return

    const { titulo, contenido, imagenUrl, publicada } = req.body
    const params = { titulo, contenido, imagenUrl, publicada }
    if ('idSede' in req.body) params.idSede = req.body.idSede ?? null
    // Solo ADMIN puede cambiar publicada
    if (publicada !== undefined && req.usuaria.rol !== 'ADMIN') delete params.publicada

    const noticia = await Noticia.actualizar(req.params.id, params)
    res.json({ ok: true, noticia })
  } catch (error) {
    console.error('Error en noticias.actualizar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la noticia.' })
  }
}

exports.eliminar = async (req, res) => {
  try {
    const base = await verificarPropietaria(req, res)
    if (!base) return
    await Noticia.eliminar(req.params.id)
    res.json({ ok: true, mensaje: 'Noticia eliminada.' })
  } catch (error) {
    console.error('Error en noticias.eliminar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la noticia.' })
  }
}

exports.subirImagen = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, mensaje: 'No se envió ninguna imagen.' })
    const imagenUrl = `/uploads/${req.file.filename}`
    const noticia   = await Noticia.actualizar(req.params.id, { imagenUrl })
    if (!noticia) return res.status(404).json({ ok: false, mensaje: 'Noticia no encontrada.' })
    res.json({ ok: true, noticia, imagenUrl })
  } catch (error) {
    console.error('Error en noticias.subirImagen:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al subir la imagen.' })
  }
}

exports.toggleLike = async (req, res) => {
  try {
    const liked = await Noticia.toggleLike(req.params.id, req.usuaria.id)
    res.json({ ok: true, liked })
  } catch (error) {
    console.error('Error en noticias.toggleLike:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al procesar el like.' })
  }
}

exports.listarComentarios = async (req, res) => {
  try {
    const comentarios = await Noticia.listarComentarios(req.params.id)
    res.json({ ok: true, comentarios })
  } catch (error) {
    console.error('Error en noticias.listarComentarios:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener los comentarios.' })
  }
}

exports.agregarComentario = async (req, res) => {
  try {
    const { contenido } = req.body
    if (!contenido?.trim()) {
      return res.status(400).json({ ok: false, mensaje: 'El comentario no puede estar vacío.' })
    }
    const comentario = await Noticia.agregarComentario({
      idNoticia: req.params.id,
      idAlumna:  req.usuaria.id,
      contenido: contenido.trim(),
    })
    res.status(201).json({ ok: true, comentario })
  } catch (error) {
    console.error('Error en noticias.agregarComentario:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al agregar el comentario.' })
  }
}
