/*
 * =====================================================================
 * controllers/materialController.js  —  Lógica del repositorio de materiales
 * =====================================================================
 *
 * Cada función aquí corresponde a una acción que puede realizar la alumna
 * sobre los materiales del repositorio.
 *
 * PATRÓN CONTROLADOR:
 *   1. Recibe la petición HTTP (req)
 *   2. Valida los datos de entrada
 *   3. Llama al Modelo para interactuar con la BD
 *   4. Devuelve la respuesta JSON (res)
 *   5. Si hay error, lo captura con try/catch
 */

const Material       = require('../models/Material')
const { getFileType } = require('../middleware/upload')
const path           = require('path')

/*
 * GET /api/materiales
 * Lista los materiales del repositorio con filtros opcionales.
 *
 * Query params:
 *   ?asignatura=1  → filtrar por asignatura
 *   ?busqueda=python → buscar por texto
 *   ?pagina=2      → paginación
 */
exports.listar = async (req, res) => {
  try {
    const { asignatura, busqueda, pagina = 1, limite = 20, id_alumna } = req.query
    const desplazamiento = (Number(pagina) - 1) * Number(limite)

    const materiales = await Material.listar({
      idAsignatura:  asignatura ? Number(asignatura) : undefined,
      idAlumna:      id_alumna  ? Number(id_alumna)  : undefined,
      busqueda,
      limite:        Number(limite),
      desplazamiento,
    })

    res.json({ ok: true, datos: materiales, pagina: Number(pagina) })
  } catch (error) {
    console.error('Error al listar materiales:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener los materiales.' })
  }
}

/*
 * GET /api/materiales/:id
 * Devuelve un material específico con todos sus datos.
 */
exports.obtener = async (req, res) => {
  try {
    const material = await Material.buscarPorId(Number(req.params.id))

    if (!material) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Material no encontrado.',
      })
    }

    res.json({ ok: true, datos: material })
  } catch (error) {
    console.error('Error al obtener material:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el material.' })
  }
}

/*
 * POST /api/materiales
 * Sube un nuevo material al repositorio.
 *
 * Requiere:
 *   - Token de sesión (middleware verificarSesion)
 *   - Archivo adjunto (procesado por Multer en upload.js)
 *   - Campos: titulo, id_asignatura, descripcion (opcional)
 */
exports.crear = async (req, res) => {
  try {
    const { titulo, descripcion, id_asignatura, codigo_html } = req.body

    if (!titulo?.trim()) {
      return res.status(400).json({ ok: false, mensaje: 'El título es obligatorio.' })
    }
    if (!id_asignatura) {
      return res.status(400).json({ ok: false, mensaje: 'Debes seleccionar una asignatura.' })
    }
    if (!req.file && !codigo_html?.trim()) {
      return res.status(400).json({ ok: false, mensaje: 'Adjunta un archivo o agrega un demo interactivo.' })
    }

    const urlArchivo    = req.file ? `/uploads/${req.file.filename}` : null
    const tipoArchivo   = req.file ? getFileType(req.file.originalname) : 'otro'
    const nombreArchivo = req.file ? req.file.originalname : null

    const material = await Material.crear({
      titulo:        titulo.trim(),
      descripcion:   descripcion?.trim() ?? null,
      nombreArchivo,
      urlArchivo,
      tamanoByte:    req.file?.size ?? null,
      tipoArchivo,
      idAsignatura:  Number(id_asignatura),
      idAlumna:      req.usuaria.id,
      codigoHtml:    codigo_html?.trim() || null,
    })

    res.status(201).json({
      ok:      true,
      mensaje: '¡Material subido exitosamente! Ya está disponible para todas las alumnas.',
      datos:   material,
    })
  } catch (error) {
    console.error('Error al crear material:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al subir el material.' })
  }
}

/*
 * GET /api/materiales/:id/descargar
 * Registra la descarga y envía el archivo.
 */
exports.descargar = async (req, res) => {
  try {
    const material = await Material.buscarPorId(Number(req.params.id))

    if (!material) {
      return res.status(404).json({ ok: false, mensaje: 'Material no encontrado.' })
    }

    // Incrementamos el contador de descargas
    await Material.registrarDescarga(material.id)

    // Construimos la ruta absoluta del archivo en el servidor
    const rutaArchivo = path.join(__dirname, '../../uploads', path.basename(material.url_archivo))

    // res.download envía el archivo con el nombre original
    res.download(rutaArchivo, material.nombre_archivo)
  } catch (error) {
    console.error('Error al descargar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al descargar el archivo.' })
  }
}

/*
 * PATCH /api/materiales/:id/codigo
 * Actualiza el codigo HTML del material. Solo la autora puede hacerlo.
 */
exports.actualizarCodigo = async (req, res) => {
  try {
    const { codigo_html } = req.body
    const actualizado = await Material.actualizarCodigo(
      Number(req.params.id),
      req.usuaria.id,
      codigo_html?.trim() || null
    )
    if (!actualizado) {
      return res.status(403).json({ ok: false, mensaje: 'No tienes permiso o el material no existe.' })
    }
    res.json({ ok: true, mensaje: 'Codigo actualizado correctamente.' })
  } catch (error) {
    console.error('Error al actualizar codigo:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el codigo.' })
  }
}

/*
 * DELETE /api/materiales/:id
 * Elimina un material. Solo puede hacerlo su autora.
 */
exports.eliminar = async (req, res) => {
  try {
    const { id: idAlumna, rol } = req.usuaria
    let idSedesPermitidas = null

    if (rol === 'ADMIN') {
      const { pool } = require('../config/db')
      const { rows } = await pool.query(
        `SELECT id_sede FROM admin_sedes WHERE id_admin = $1`, [idAlumna]
      )
      idSedesPermitidas = rows.length > 0 ? rows.map(r => r.id_sede) : null
    }

    const eliminado = await Material.eliminar(
      Number(req.params.id),
      idAlumna,
      { esAdmin: rol === 'ADMIN', idSedesPermitidas }
    )

    if (!eliminado) {
      return res.status(403).json({
        ok:      false,
        mensaje: 'No tienes permiso para eliminar este material, o no existe.',
      })
    }

    res.json({ ok: true, mensaje: 'Material eliminado correctamente.' })
  } catch (error) {
    console.error('Error al eliminar material:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar el material.' })
  }
}
