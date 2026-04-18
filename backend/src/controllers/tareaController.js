/*
 * ============================================================
 * controllers/tareaController.js  —  Lógica de tareas MMT
 * ============================================================
 *
 * RUTAS:
 *   GET    /api/tareas/alumnas            → usuarias asignables (filtradas por sede)
 *   GET    /api/tareas                    → listar (filtradas por sede del usuario)
 *   GET    /api/tareas/:id                → detalle
 *   POST   /api/tareas                    → crear (ADMIN, LIDER)
 *   PATCH  /api/tareas/:id               → actualizar (creador, asignada, ADMIN)
 *   PATCH  /api/tareas/:id/estado         → cambiar estado
 *   PATCH  /api/tareas/:id/asignar        → gestionar asignadas (ADMIN, LIDER)
 *   DELETE /api/tareas/:id                → eliminar (ADMIN, LIDER creadora)
 *   GET    /api/tareas/:id/comentarios    → listar comentarios
 *   POST   /api/tareas/:id/comentarios    → agregar comentario
 */

const Tarea    = require('../models/Tarea')
const { pool } = require('../config/db')

// Verifica que un hito existe; devuelve el id validado o null
async function resolverIdHito(idHito) {
  if (!idHito) return null
  const { rows } = await pool.query(`SELECT id FROM hitos WHERE id = $1`, [Number(idHito)])
  return rows.length > 0 ? Number(idHito) : null
}

const RUTAS_VALIDAS       = ['LIDERAZGO', 'VOCACION', 'PROYECTOS']
const PRIORIDADES_VALIDAS = ['ALTA', 'MEDIA', 'BAJA']
const ESTADOS_VALIDOS     = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA']

// Devuelve array de sede IDs permitidos para este usuario.
// null = sin restricción (ve todo).
async function getIdSedes(usuaria) {
  if (usuaria.rol === 'ADMIN') {
    const { rows } = await pool.query(
      `SELECT id_sede FROM admin_sedes WHERE id_admin = $1`, [usuaria.id]
    )
    return rows.length > 0 ? rows.map(r => r.id_sede) : null
  }
  return usuaria.id_sede ? [usuaria.id_sede] : null
}

// Verifica si el usuario puede modificar la tarea (campos + asignadas).
async function puedeModificar(tarea, usuaria) {
  if (usuaria.rol === 'ADMIN') {
    const { rows } = await pool.query(
      `SELECT id_sede FROM admin_sedes WHERE id_admin = $1`, [usuaria.id]
    )
    if (rows.length > 0) {
      const sedes = rows.map(r => r.id_sede)
      if (tarea.id_sede && !sedes.includes(tarea.id_sede)) return false
    }
    return true
  }
  if (tarea.id_creada_por === usuaria.id) return true
  if (await Tarea.estaAsignada(tarea.id, usuaria.id)) return true
  // También puede modificar si es miembro del proyecto al que pertenece la tarea
  if (tarea.id_proyecto) {
    const { rows } = await pool.query(
      `SELECT 1 FROM proyecto_asignadas WHERE id_proyecto = $1 AND id_alumna = $2`,
      [tarea.id_proyecto, usuaria.id]
    )
    if (rows.length > 0) return true
  }
  return false
}

// ----------------------------------------------------------------

/*
 * GET /api/tareas/alumnas
 * Devuelve usuarias asignables (misma sede o todas si ADMIN).
 */
exports.listarAlumnas = async (req, res) => {
  try {
    const idSedes = await getIdSedes(req.usuaria)
    let query, valores = []

    if (idSedes && idSedes.length > 0) {
      valores = [idSedes]
      query = `SELECT id, nombre, email, rol FROM alumnas
               WHERE id_sede = ANY($1::integer[]) ORDER BY nombre ASC`
    } else {
      query = `SELECT id, nombre, email, rol FROM alumnas ORDER BY nombre ASC`
    }

    const { rows } = await pool.query(query, valores)
    res.json({ ok: true, alumnas: rows })
  } catch (error) {
    console.error('Error en tareas.listarAlumnas:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener alumnas.' })
  }
}

/*
 * GET /api/tareas
 */
exports.listar = async (req, res) => {
  try {
    const { ruta, estado } = req.query
    const idSedes = await getIdSedes(req.usuaria)
    const tareas  = await Tarea.listar({
      ruta:   ruta   || null,
      estado: estado || null,
      idSedes,
    })
    res.json({ ok: true, tareas })
  } catch (error) {
    console.error('Error en tareas.listar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener las tareas.' })
  }
}

/*
 * GET /api/tareas/:id
 */
exports.obtener = async (req, res) => {
  try {
    const tarea = await Tarea.buscarPorId(req.params.id)
    if (!tarea) return res.status(404).json({ ok: false, mensaje: 'Tarea no encontrada.' })
    res.json({ ok: true, tarea })
  } catch (error) {
    console.error('Error en tareas.obtener:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener la tarea.' })
  }
}

/*
 * POST /api/tareas  (ADMIN, LIDER)
 * Body: { titulo, descripcion?, prioridad, ruta, idsAsignadas?, idProyecto?, idHito?, fechaLimite? }
 */
exports.crear = async (req, res) => {
  try {
    const { titulo, descripcion, prioridad, ruta, idsAsignadas = [], idProyecto, idHito, fechaLimite } = req.body

    if (!titulo?.trim())                  return res.status(400).json({ ok: false, mensaje: 'El título es obligatorio.' })
    if (!RUTAS_VALIDAS.includes(ruta))    return res.status(400).json({ ok: false, mensaje: `Ruta inválida. Valores: ${RUTAS_VALIDAS.join(', ')}.` })
    if (!PRIORIDADES_VALIDAS.includes(prioridad)) return res.status(400).json({ ok: false, mensaje: `Prioridad inválida.` })

    const tarea = await Tarea.crear({
      titulo:      titulo.trim(),
      descripcion: descripcion?.trim() ?? null,
      prioridad,
      ruta,
      idsAsignadas: Array.isArray(idsAsignadas) ? idsAsignadas.map(Number) : [],
      idCreadaPor:  req.usuaria.id,
      idProyecto:   idProyecto ? Number(idProyecto) : null,
      idHito:       await resolverIdHito(idHito),
      fechaLimite:  fechaLimite  || null,
      idSede:       req.usuaria.id_sede ?? null,
    })

    res.status(201).json({ ok: true, tarea })
  } catch (error) {
    console.error('Error en tareas.crear:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al crear la tarea.' })
  }
}

/*
 * PATCH /api/tareas/:id
 * Permite editar titulo, descripcion, prioridad, ruta, lecciones, idProyecto.
 * Autorizado: creadora, cualquier asignada, ADMIN (con restricción de sede).
 */
exports.actualizar = async (req, res) => {
  try {
    const tarea = await Tarea.buscarPorId(req.params.id)
    if (!tarea) return res.status(404).json({ ok: false, mensaje: 'Tarea no encontrada.' })

    if (!(await puedeModificar(tarea, req.usuaria))) {
      return res.status(403).json({ ok: false, mensaje: 'No tienes permiso para modificar esta tarea.' })
    }

    const { titulo, descripcion, prioridad, ruta, lecciones, idProyecto, idHito, fechaLimite, idCreadaPor } = req.body
    const params = { titulo, descripcion, prioridad, ruta, lecciones }
    if ('idProyecto'  in req.body) params.idProyecto  = idProyecto
    if ('idHito'      in req.body) params.idHito      = await resolverIdHito(idHito)
    if ('fechaLimite' in req.body) params.fechaLimite = fechaLimite || null
    if ('idCreadaPor' in req.body && req.usuaria.rol === 'ADMIN') params.idCreadaPor = idCreadaPor

    const actualizada = await Tarea.actualizar(tarea.id, params)
    res.json({ ok: true, tarea: actualizada })
  } catch (error) {
    console.error('Error en tareas.actualizar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la tarea.' })
  }
}

/*
 * PATCH /api/tareas/:id/estado
 * ALUMNA: solo sus tareas asignadas.
 * LIDER / ADMIN: cualquier tarea.
 */
exports.cambiarEstado = async (req, res) => {
  try {
    const { estado, lecciones }       = req.body
    const { id: idUsuaria, rol }      = req.usuaria

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: `Estado inválido. Valores: ${ESTADOS_VALIDOS.join(', ')}.` })
    }
    if (estado === 'COMPLETADA' && !lecciones?.trim()) {
      return res.status(400).json({ ok: false, mensaje: 'Debes registrar las lecciones aprendidas.' })
    }

    const tarea = await Tarea.buscarPorId(req.params.id)
    if (!tarea) return res.status(404).json({ ok: false, mensaje: 'Tarea no encontrada.' })

    if (rol === 'ALUMNA') {
      const asignada = await Tarea.estaAsignada(tarea.id, idUsuaria)
      // También permitir si es miembro del proyecto de la tarea
      let puedePortProyecto = false
      if (!asignada && tarea.id_proyecto) {
        const { rows } = await pool.query(
          `SELECT 1 FROM proyecto_asignadas WHERE id_proyecto = $1 AND id_alumna = $2`,
          [tarea.id_proyecto, idUsuaria]
        )
        puedePortProyecto = rows.length > 0
      }
      if (!asignada && !puedePortProyecto) {
        return res.status(403).json({ ok: false, mensaje: 'Solo puedes cambiar el estado de tareas asignadas a ti o de tus proyectos.' })
      }
    }

    const actualizada = await Tarea.cambiarEstado(tarea.id, {
      estado,
      lecciones: lecciones?.trim() ?? null,
    })
    res.json({ ok: true, tarea: actualizada })
  } catch (error) {
    console.error('Error en tareas.cambiarEstado:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el estado.' })
  }
}

/*
 * PATCH /api/tareas/:id/asignar  (ADMIN, LIDER)
 * Body: { idsAlumnas: number[] }  — vacío = sin asignar
 */
exports.asignar = async (req, res) => {
  try {
    const tarea = await Tarea.buscarPorId(req.params.id)
    if (!tarea) return res.status(404).json({ ok: false, mensaje: 'Tarea no encontrada.' })

    const { idsAlumnas = [] } = req.body
    const actualizada = await Tarea.actualizarAsignadas(
      tarea.id,
      Array.isArray(idsAlumnas) ? idsAlumnas.map(Number) : []
    )
    res.json({ ok: true, tarea: actualizada })
  } catch (error) {
    console.error('Error en tareas.asignar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al asignar la tarea.' })
  }
}

/*
 * DELETE /api/tareas/:id  (ADMIN, LIDER)
 */
exports.eliminar = async (req, res) => {
  try {
    const eliminada = await Tarea.eliminar(req.params.id, req.usuaria.id, req.usuaria.rol)
    if (!eliminada) return res.status(404).json({ ok: false, mensaje: 'Tarea no encontrada o sin permiso.' })
    res.json({ ok: true, mensaje: 'Tarea eliminada.' })
  } catch (error) {
    console.error('Error en tareas.eliminar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la tarea.' })
  }
}

/*
 * PATCH /api/tareas/:id/proyecto  (ADMIN, LIDER)
 */
exports.asignarProyecto = async (req, res) => {
  try {
    const tarea = await Tarea.buscarPorId(req.params.id)
    if (!tarea) return res.status(404).json({ ok: false, mensaje: 'Tarea no encontrada.' })
    const actualizada = await Tarea.asignarProyecto(req.params.id, req.body.idProyecto ?? null)
    res.json({ ok: true, tarea: actualizada })
  } catch (error) {
    console.error('Error en tareas.asignarProyecto:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al asociar la tarea.' })
  }
}

/*
 * GET /api/tareas/:id/comentarios
 */
exports.listarComentarios = async (req, res) => {
  try {
    const tarea = await Tarea.buscarPorId(req.params.id)
    if (!tarea) return res.status(404).json({ ok: false, mensaje: 'Tarea no encontrada.' })
    const comentarios = await Tarea.listarComentarios(req.params.id)
    res.json({ ok: true, comentarios })
  } catch (error) {
    console.error('Error en tareas.listarComentarios:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener los comentarios.' })
  }
}

/*
 * POST /api/tareas/:id/comentarios
 */
exports.agregarComentario = async (req, res) => {
  try {
    const { contenido } = req.body
    if (!contenido?.trim()) return res.status(400).json({ ok: false, mensaje: 'El comentario no puede estar vacío.' })

    const tarea = await Tarea.buscarPorId(req.params.id)
    if (!tarea) return res.status(404).json({ ok: false, mensaje: 'Tarea no encontrada.' })

    const comentario = await Tarea.agregarComentario({
      idTarea:   req.params.id,
      idAlumna:  req.usuaria.id,
      contenido: contenido.trim(),
    })
    res.status(201).json({ ok: true, comentario })
  } catch (error) {
    console.error('Error en tareas.agregarComentario:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al agregar el comentario.' })
  }
}

