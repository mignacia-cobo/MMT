/*
 * controllers/adminController.js — Gestión administrativa MMT
 *
 * Endpoints:
 *   GET   /api/admin/usuarias             → listar (filtrado por permisos de sede)
 *   PATCH /api/admin/usuarias/:id/rol     → cambiar rol y ruta asignada
 *   PATCH /api/admin/usuarias/:id/sede    → cambiar sede
 *   GET   /api/admin/metricas             → stats para el dashboard
 *   GET   /api/admin/usuarias/:id/permisos → sedes permitidas de un admin
 *   PUT   /api/admin/usuarias/:id/permisos → actualizar permisos de sede
 */

const { pool } = require('../config/db')
const bcrypt    = require('bcrypt')

const ROLES_VALIDOS = ['ADMIN', 'LIDER', 'ALUMNA']
const RUTAS_VALIDAS = ['LIDERAZGO', 'VOCACION', 'PROYECTOS', null]

/* ---- Helpers ---- */
async function sedesPermitidasDeAdmin(idAdmin) {
  const { rows } = await pool.query(
    `SELECT id_sede FROM admin_sedes WHERE id_admin = $1`,
    [idAdmin]
  )
  return rows.map(r => r.id_sede)
}

/* ---- Controllers ---- */

exports.listarUsuarias = async (req, res) => {
  try {
    const permisos = await sedesPermitidasDeAdmin(req.usuaria.id)

    let query, valores = []
    const base = `
      SELECT a.id, a.nombre, a.email, a.carrera, a.anio_cohorte,
             a.rol, a.ruta_asignada, a.id_sede,
             s.nombre AS nombre_sede, a.creado_en
      FROM alumnas a
      LEFT JOIN sedes s ON s.id = a.id_sede
    `
    if (permisos.length === 0) {
      query = `${base} ORDER BY a.nombre ASC`
    } else {
      valores = [permisos]
      query = `${base} WHERE a.id_sede = ANY($1::integer[]) ORDER BY a.nombre ASC`
    }

    const { rows } = await pool.query(query, valores)
    res.json({ ok: true, alumnas: rows })
  } catch (error) {
    console.error('Error en admin.listarUsuarias:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener usuarias.' })
  }
}

exports.actualizarRol = async (req, res) => {
  try {
    const { rol, rutaAsignada } = req.body
    if (!ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ ok: false, mensaje: 'Rol invalido.' })
    }
    const rutaFinal = rol === 'LIDER' ? (rutaAsignada ?? null) : null
    const { rows } = await pool.query(
      `UPDATE alumnas SET rol = $1, ruta_asignada = $2
       WHERE id = $3 RETURNING id, nombre, rol, ruta_asignada`,
      [rol, rutaFinal, req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Usuaria no encontrada.' })
    res.json({ ok: true, alumna: rows[0] })
  } catch (error) {
    console.error('Error en admin.actualizarRol:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar rol.' })
  }
}

exports.actualizarSede = async (req, res) => {
  try {
    const { idSede } = req.body
    const { rows } = await pool.query(
      `UPDATE alumnas SET id_sede = $1 WHERE id = $2 RETURNING id, nombre, id_sede`,
      [idSede ?? null, req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Usuaria no encontrada.' })
    res.json({ ok: true, alumna: rows[0] })
  } catch (error) {
    console.error('Error en admin.actualizarSede:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar sede.' })
  }
}

exports.metricas = async (req, res) => {
  try {
    const permisos = await sedesPermitidasDeAdmin(req.usuaria.id)
    const filtroSede = permisos.length > 0 ? `WHERE a.id_sede = ANY(ARRAY[${permisos.join(',')}])` : ''

    const { rows: [totales] } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM alumnas ${filtroSede ? filtroSede.replace('a.', 'alumnas.').replace('WHERE', 'WHERE') : ''})::integer AS total_alumnas,
        (SELECT COUNT(*) FROM alumnas WHERE rol = 'LIDER' ${permisos.length > 0 ? `AND id_sede = ANY(ARRAY[${permisos.join(',')}])` : ''})::integer AS total_lideres,
        (SELECT COUNT(*) FROM materiales)::integer AS total_materiales,
        (SELECT COUNT(*) FROM tareas WHERE estado = 'COMPLETADA')::integer AS tareas_completadas,
        (SELECT COUNT(*) FROM proyectos WHERE estado IN ('APROBADO','FINALIZADO'))::integer AS proyectos_activos,
        (SELECT COUNT(*) FROM noticias WHERE publicada = TRUE)::integer AS noticias_publicadas
    `)

    const sedeWhere = permisos.length > 0
      ? `WHERE a.id_sede = ANY(ARRAY[${permisos.join(',')}]::integer[])`
      : ''

    const { rows: porCarrera } = await pool.query(`
      SELECT carrera, COUNT(*)::integer AS total
      FROM alumnas a
      ${sedeWhere}
      WHERE carrera IS NOT NULL
      GROUP BY carrera ORDER BY total DESC LIMIT 10
    `)

    const { rows: porSede } = await pool.query(`
      SELECT COALESCE(s.nombre, 'Sin sede') AS nombre, COUNT(a.id)::integer AS total
      FROM alumnas a
      LEFT JOIN sedes s ON s.id = a.id_sede
      GROUP BY s.id, s.nombre ORDER BY total DESC
    `)

    res.json({ ok: true, totales, porCarrera, porSede })
  } catch (error) {
    console.error('Error en admin.metricas:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener metricas.' })
  }
}

exports.listarPermisosAdmin = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_sede FROM admin_sedes WHERE id_admin = $1`,
      [req.params.id]
    )
    res.json({ ok: true, sedes: rows.map(r => r.id_sede) })
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener permisos.' })
  }
}

exports.listarNoticias = async (req, res) => {
  try {
    const permisos = await sedesPermitidasDeAdmin(req.usuaria.id)
    let query, valores = []
    const base = `
      SELECT n.id, n.titulo, n.contenido, n.imagen_url, n.publicada,
             n.id_sede, n.creado_en, n.actualizado_en,
             a.nombre AS nombre_autora,
             s.nombre AS nombre_sede,
             CAST(COUNT(DISTINCT l.id_alumna) AS INTEGER) AS likes,
             CAST(COUNT(DISTINCT c.id)        AS INTEGER) AS comentarios
      FROM noticias n
      JOIN alumnas a ON a.id = n.id_autora
      LEFT JOIN sedes s ON s.id = n.id_sede
      LEFT JOIN likes_noticias l ON l.id_noticia = n.id
      LEFT JOIN comentarios_noticias c ON c.id_noticia = n.id
    `
    if (permisos.length === 0) {
      query = `${base} GROUP BY n.id, a.nombre, s.nombre ORDER BY n.creado_en DESC`
    } else {
      valores = [permisos]
      query = `${base} WHERE n.id_sede = ANY($1::integer[]) GROUP BY n.id, a.nombre, s.nombre ORDER BY n.creado_en DESC`
    }
    const { rows } = await pool.query(query, valores)
    res.json({ ok: true, noticias: rows })
  } catch (error) {
    console.error('Error en admin.listarNoticias:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener noticias.' })
  }
}

/* ---- Asignaturas ---- */
const Asignatura = require('../models/Asignatura')

exports.listarAsignaturas = async (req, res) => {
  try {
    const asignaturas = await Asignatura.listar()
    res.json({ ok: true, asignaturas })
  } catch (error) {
    console.error('Error en admin.listarAsignaturas:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener asignaturas.' })
  }
}

exports.crearAsignatura = async (req, res) => {
  try {
    const { nombre, codigo, descripcion } = req.body
    if (!nombre?.trim()) return res.status(400).json({ ok: false, mensaje: 'El nombre es obligatorio.' })
    const asignatura = await Asignatura.crear({ nombre, codigo, descripcion })
    res.status(201).json({ ok: true, asignatura })
  } catch (error) {
    console.error('Error en admin.crearAsignatura:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al crear la asignatura.' })
  }
}

exports.actualizarAsignatura = async (req, res) => {
  try {
    const asignatura = await Asignatura.actualizar(req.params.id, req.body)
    if (!asignatura) return res.status(404).json({ ok: false, mensaje: 'Asignatura no encontrada.' })
    res.json({ ok: true, asignatura })
  } catch (error) {
    console.error('Error en admin.actualizarAsignatura:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la asignatura.' })
  }
}

exports.actualizarPermisosAdmin = async (req, res) => {
  try {
    const { sedeIds = [] } = req.body
    const idAdmin = req.params.id
    await pool.query(`DELETE FROM admin_sedes WHERE id_admin = $1`, [idAdmin])
    for (const idSede of sedeIds) {
      await pool.query(
        `INSERT INTO admin_sedes (id_admin, id_sede) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [idAdmin, idSede]
      )
    }
    res.json({ ok: true, mensaje: 'Permisos de sede actualizados.' })
  } catch (error) {
    console.error('Error en admin.actualizarPermisosAdmin:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar permisos.' })
  }
}

exports.crearUsuaria = async (req, res) => {
  try {
    const { nombre, email, password, carrera, anioCohorte, rol, idSede, rutaAsignada } = req.body
    if (!nombre?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Nombre, email y contraseña son obligatorios.' })
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres.' })
    }
    if (rol && !ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ ok: false, mensaje: 'Rol inválido.' })
    }

    const { rows: existe } = await pool.query(
      `SELECT id FROM alumnas WHERE email = $1`, [email.toLowerCase().trim()]
    )
    if (existe.length > 0) {
      return res.status(409).json({ ok: false, mensaje: 'Este email ya está registrado.' })
    }

    const hash = await bcrypt.hash(password, 10)
    const rolFinal   = rol ?? 'ALUMNA'
    const rutaFinal  = rolFinal === 'LIDER' ? (rutaAsignada ?? null) : null

    const { rows } = await pool.query(`
      INSERT INTO alumnas (nombre, email, password_hash, carrera, anio_cohorte, rol, ruta_asignada, id_sede)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      nombre.trim(),
      email.toLowerCase().trim(),
      hash,
      carrera ?? null,
      anioCohorte ?? 2026,
      rolFinal,
      rutaFinal,
      idSede ? Number(idSede) : null,
    ])

    const { rows: sedeRows } = await pool.query(
      `SELECT a.id, a.nombre, a.email, a.carrera, a.anio_cohorte, a.rol, a.ruta_asignada,
              a.id_sede, s.nombre AS nombre_sede, a.creado_en
       FROM alumnas a LEFT JOIN sedes s ON s.id = a.id_sede WHERE a.id = $1`,
      [rows[0].id]
    )
    res.status(201).json({ ok: true, alumna: sedeRows[0] })
  } catch (error) {
    console.error('Error en admin.crearUsuaria:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al crear la usuaria.' })
  }
}

exports.actualizarUsuaria = async (req, res) => {
  try {
    const { nombre, email, carrera, anioCohorte } = req.body
    const id = req.params.id

    const sets  = []
    const vals  = []
    let   i     = 1

    if (nombre      !== undefined) { sets.push(`nombre       = $${i++}`); vals.push(nombre.trim()) }
    if (email       !== undefined) { sets.push(`email        = $${i++}`); vals.push(email.toLowerCase().trim()) }
    if (carrera     !== undefined) { sets.push(`carrera      = $${i++}`); vals.push(carrera) }
    if (anioCohorte !== undefined) { sets.push(`anio_cohorte = $${i++}`); vals.push(Number(anioCohorte)) }

    if (sets.length === 0) {
      return res.status(400).json({ ok: false, mensaje: 'No hay campos para actualizar.' })
    }

    vals.push(id)
    const { rows } = await pool.query(`
      UPDATE alumnas SET ${sets.join(', ')} WHERE id = $${i}
      RETURNING id
    `, vals)

    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Usuaria no encontrada.' })

    const { rows: full } = await pool.query(
      `SELECT a.id, a.nombre, a.email, a.carrera, a.anio_cohorte, a.rol, a.ruta_asignada,
              a.id_sede, s.nombre AS nombre_sede, a.creado_en
       FROM alumnas a LEFT JOIN sedes s ON s.id = a.id_sede WHERE a.id = $1`,
      [rows[0].id]
    )
    res.json({ ok: true, alumna: full[0] })
  } catch (error) {
    console.error('Error en admin.actualizarUsuaria:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la usuaria.' })
  }
}

exports.eliminarUsuaria = async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (id === req.usuaria.id) {
      return res.status(400).json({ ok: false, mensaje: 'No puedes eliminar tu propia cuenta.' })
    }
    const { rowCount } = await pool.query(`DELETE FROM alumnas WHERE id = $1`, [id])
    if (rowCount === 0) return res.status(404).json({ ok: false, mensaje: 'Usuaria no encontrada.' })
    res.json({ ok: true, mensaje: 'Usuaria eliminada.' })
  } catch (error) {
    console.error('Error en admin.eliminarUsuaria:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la usuaria.' })
  }
}
