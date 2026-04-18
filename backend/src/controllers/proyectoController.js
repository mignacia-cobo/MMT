/*
 * ============================================================
 * controllers/proyectoController.js  —  Lógica de proyectos MMT
 * ============================================================
 *
 * RUTAS:
 *   GET    /api/proyectos                → listar (filtro automático por rol)
 *   GET    /api/proyectos/alumnas        → usuarias asignables
 *   GET    /api/proyectos/:id            → detalle
 *   POST   /api/proyectos                → postular (cualquier usuaria)
 *   PATCH  /api/proyectos/:id/estado     → cambiar estado (ADMIN)
 *   PATCH  /api/proyectos/:id/lider      → asignar líder (ADMIN)
 *   PATCH  /api/proyectos/:id/asignar    → gestionar miembros (ADMIN, LIDER)
 *
 * RBAC:
 *   ADMIN  → ve todos; puede cambiar estado, lider y miembros
 *   LIDER  → ve solo los de su ruta_asignada; puede gestionar miembros
 *   ALUMNA → ve propios + APROBADO/FINALIZADO + proyectos en que es miembro
 */

const Proyecto    = require('../models/Proyecto')
const { pool }    = require('../config/db')

const ESTADOS_VALIDOS = ['PENDIENTE', 'EN_REVISION', 'APROBADO', 'FINALIZADO']
const RUTAS_VALIDAS   = ['LIDERAZGO', 'VOCACION', 'PROYECTOS']

// Devuelve array de IDs de sede permitidos para este admin (null = sin restricción).
async function getIdSedesAdmin(idAdmin) {
  const { rows } = await pool.query(
    `SELECT id_sede FROM admin_sedes WHERE id_admin = $1`, [idAdmin]
  )
  return rows.length > 0 ? rows.map(r => r.id_sede) : null
}

/*
 * GET /api/proyectos/alumnas
 * Devuelve usuarias asignables al proyecto (filtradas por sede del admin si aplica).
 */
exports.listarAlumnas = async (req, res) => {
  try {
    const { rol, id, id_sede } = req.usuaria
    let query, valores = []

    if (rol === 'ADMIN') {
      const sedesPermitidas = await getIdSedesAdmin(id)
      if (sedesPermitidas) {
        valores = [sedesPermitidas]
        query   = `SELECT id, nombre, email, rol FROM alumnas WHERE id_sede = ANY($1::integer[]) ORDER BY nombre`
      } else {
        query = `SELECT id, nombre, email, rol FROM alumnas ORDER BY nombre`
      }
    } else {
      // LIDER: solo su sede
      valores = [id_sede]
      query   = `SELECT id, nombre, email, rol FROM alumnas WHERE id_sede = $1 ORDER BY nombre`
    }

    const { rows } = await pool.query(query, valores)
    res.json({ ok: true, alumnas: rows })
  } catch (error) {
    console.error('Error en proyectos.listarAlumnas:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener alumnas.' })
  }
}

/*
 * GET /api/proyectos
 */
exports.listar = async (req, res) => {
  try {
    const { estado }                              = req.query
    const { rol, id: idAlumna, ruta_asignada }   = req.usuaria

    let proyectos

    if (rol === 'ADMIN') {
      const { ruta } = req.query
      proyectos = await Proyecto.listar({
        ruta:   ruta   || null,
        estado: estado || null,
      })
    } else if (rol === 'LIDER') {
      if (!ruta_asignada) {
        return res.json({ ok: true, proyectos: [], aviso: 'No tienes una ruta asignada aún.' })
      }
      proyectos = await Proyecto.listar({
        ruta:             ruta_asignada,
        estado:           estado || null,
        idAlumnaAsignada: idAlumna,
      })
    } else {
      // ALUMNA: propios + públicos + asignada
      proyectos = await Proyecto.listar({
        estado:               estado || null,
        idPostulante:         idAlumna,
        idAlumnaAsignada:     idAlumna,
        soloPublicosYPropios: true,
      })
    }

    res.json({ ok: true, proyectos })
  } catch (error) {
    console.error('Error en proyectos.listar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener los proyectos.' })
  }
}

/*
 * GET /api/proyectos/:id
 */
exports.obtener = async (req, res) => {
  try {
    const proyecto = await Proyecto.buscarPorId(req.params.id)
    if (!proyecto) return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado.' })
    res.json({ ok: true, proyecto })
  } catch (error) {
    console.error('Error en proyectos.obtener:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el proyecto.' })
  }
}

/*
 * POST /api/proyectos
 */
exports.postular = async (req, res) => {
  try {
    const { nombre, descripcion, ruta } = req.body

    if (!nombre?.trim()) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre del proyecto es obligatorio.' })
    }
    if (!RUTAS_VALIDAS.includes(ruta)) {
      return res.status(400).json({ ok: false, mensaje: `Ruta inválida. Valores: ${RUTAS_VALIDAS.join(', ')}.` })
    }

    const proyecto = await Proyecto.crear({
      nombre:       nombre.trim(),
      descripcion:  descripcion?.trim() ?? null,
      ruta,
      idPostulante: req.usuaria.id,
      idSede:       req.usuaria.id_sede ?? null,
    })

    res.status(201).json({
      ok:      true,
      mensaje: '¡Proyecto postulado! Quedará en revisión por el equipo MMT.',
      proyecto,
    })
  } catch (error) {
    console.error('Error en proyectos.postular:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al postular el proyecto.' })
  }
}

/*
 * GET /api/proyectos/:id/tareas
 */
exports.listarTareas = async (req, res) => {
  try {
    const proyecto = await Proyecto.buscarPorId(req.params.id)
    if (!proyecto) return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado.' })
    const tareas = await Proyecto.listarTareas(req.params.id)
    res.json({ ok: true, tareas })
  } catch (error) {
    console.error('Error en proyectos.listarTareas:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener las tareas del proyecto.' })
  }
}

/*
 * PATCH /api/proyectos/:id  (postulante, miembro del equipo, ADMIN)
 * Body: { nombre?, descripcion?, ruta? }
 */
exports.actualizar = async (req, res) => {
  try {
    const proyecto = await Proyecto.buscarPorId(req.params.id)
    if (!proyecto) return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado.' })

    const { rol, id: idAlumna } = req.usuaria

    // Verificar permiso: ADMIN, postulante o miembro del equipo
    if (rol !== 'ADMIN') {
      const esPostulante = proyecto.id_postulante === idAlumna
      const esMiembro    = await Proyecto.estaAsignada(proyecto.id, idAlumna)
      if (!esPostulante && !esMiembro) {
        return res.status(403).json({ ok: false, mensaje: 'No tienes permiso para editar este proyecto.' })
      }
    }

    const { nombre, descripcion, ruta } = req.body

    if (nombre !== undefined && !nombre.trim()) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre no puede estar vacío.' })
    }
    if (ruta !== undefined && !RUTAS_VALIDAS.includes(ruta)) {
      return res.status(400).json({ ok: false, mensaje: `Ruta inválida. Valores: ${RUTAS_VALIDAS.join(', ')}.` })
    }

    const actualizado = await Proyecto.actualizar(proyecto.id, {
      nombre:      nombre      !== undefined ? nombre.trim()           : undefined,
      descripcion: descripcion !== undefined ? (descripcion?.trim() || null) : undefined,
      ruta:        ruta        !== undefined ? ruta                    : undefined,
    })

    res.json({ ok: true, mensaje: 'Proyecto actualizado.', proyecto: actualizado })
  } catch (error) {
    console.error('Error en proyectos.actualizar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el proyecto.' })
  }
}

/*
 * PATCH /api/proyectos/:id/estado  (ADMIN)
 */
exports.actualizarEstado = async (req, res) => {
  try {
    const { estado } = req.body
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: `Estado inválido. Valores: ${ESTADOS_VALIDOS.join(', ')}.` })
    }
    const proyecto = await Proyecto.buscarPorId(req.params.id)
    if (!proyecto) return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado.' })

    const actualizado = await Proyecto.actualizarEstado(req.params.id, estado)
    res.json({ ok: true, mensaje: 'Estado actualizado.', proyecto: actualizado })
  } catch (error) {
    console.error('Error en proyectos.actualizarEstado:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el estado.' })
  }
}

/*
 * PATCH /api/proyectos/:id/lider  (ADMIN)
 */
exports.asignarLider = async (req, res) => {
  try {
    const proyecto = await Proyecto.buscarPorId(req.params.id)
    if (!proyecto) return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado.' })

    const actualizado = await Proyecto.asignarLider(req.params.id, req.body.idLider ?? null)
    res.json({ ok: true, mensaje: 'Líder asignada correctamente.', proyecto: actualizado })
  } catch (error) {
    console.error('Error en proyectos.asignarLider:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al asignar líder.' })
  }
}

/*
 * PATCH /api/proyectos/:id/asignar  (ADMIN, LIDER)
 * Body: { idsAlumnas: number[] }
 */
/*
 * DELETE /api/proyectos/:id  (ADMIN)
 */
exports.eliminar = async (req, res) => {
  try {
    const proyecto = await Proyecto.buscarPorId(req.params.id)
    if (!proyecto) return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado.' })

    // Restricción de sede del admin
    if (req.usuaria.rol === 'ADMIN') {
      const sedesPermitidas = await getIdSedesAdmin(req.usuaria.id)
      if (sedesPermitidas && proyecto.id_sede && !sedesPermitidas.includes(proyecto.id_sede)) {
        return res.status(403).json({ ok: false, mensaje: 'No tienes permiso para eliminar proyectos de esta sede.' })
      }
    }

    await Proyecto.eliminar(req.params.id)
    res.json({ ok: true, mensaje: 'Proyecto eliminado.' })
  } catch (error) {
    console.error('Error en proyectos.eliminar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar el proyecto.' })
  }
}

/*
 * PATCH /api/proyectos/:id/postulante  (ADMIN)
 * Cambia la postulante/creadora del proyecto.
 */
exports.actualizarPostulante = async (req, res) => {
  try {
    const { idPostulante } = req.body
    if (!idPostulante) return res.status(400).json({ ok: false, mensaje: 'idPostulante es obligatorio.' })
    const proyecto = await Proyecto.buscarPorId(req.params.id)
    if (!proyecto) return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado.' })
    const actualizado = await Proyecto.actualizarPostulante(req.params.id, Number(idPostulante))
    res.json({ ok: true, proyecto: actualizado })
  } catch (error) {
    console.error('Error en proyectos.actualizarPostulante:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la postulante.' })
  }
}

exports.asignarMiembros = async (req, res) => {
  try {
    const proyecto = await Proyecto.buscarPorId(req.params.id)
    if (!proyecto) return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado.' })

    const { idsAlumnas = [] } = req.body
    const actualizado = await Proyecto.actualizarAsignadas(
      proyecto.id,
      Array.isArray(idsAlumnas) ? idsAlumnas.map(Number) : []
    )
    res.json({ ok: true, proyecto: actualizado })
  } catch (error) {
    console.error('Error en proyectos.asignarMiembros:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al gestionar miembros del proyecto.' })
  }
}

