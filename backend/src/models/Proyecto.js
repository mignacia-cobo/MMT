/*
 * ============================================================
 * models/Proyecto.js  —  Modelo de datos de proyectos MMT
 * ============================================================
 *
 * TABLAS: proyectos, proyecto_asignadas
 *
 * Los miembros del proyecto se almacenan en proyecto_asignadas (N:N).
 * id_sede se hereda de la postulante al crear.
 * id_lider sigue como referencia rápida al responsable principal.
 *
 * Estados: PENDIENTE → EN_REVISION → APROBADO → FINALIZADO
 */

const { pool } = require('../config/db')

const BASE_SELECT = `
  SELECT
    p.id,
    p.nombre,
    p.descripcion,
    p.estado,
    p.ruta,
    p.id_sede,
    p.creado_en,
    l.id       AS id_lider,
    l.nombre   AS nombre_lider,
    po.id      AS id_postulante,
    po.nombre  AS nombre_postulante,
    po.carrera AS carrera_postulante,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT('id', al.id, 'nombre', al.nombre)
        ORDER BY al.nombre
      ) FILTER (WHERE al.id IS NOT NULL),
      '[]'::json
    ) AS asignadas
  FROM proyectos p
  LEFT JOIN alumnas l  ON l.id  = p.id_lider
  LEFT JOIN alumnas po ON po.id = p.id_postulante
  LEFT JOIN proyecto_asignadas pa ON pa.id_proyecto = p.id
  LEFT JOIN alumnas al            ON al.id = pa.id_alumna
`

const Proyecto = {

  /*
   * Listar proyectos.
   * idAlumnaAsignada: incluye proyectos donde esta alumna es miembro.
   * soloPublicosYPropios: para ALUMNA (propios + APROBADO/FINALIZADO + asignada).
   */
  async listar({ ruta, estado, idPostulante, idAlumnaAsignada, soloPublicosYPropios = false } = {}) {
    const condiciones = []
    const valores     = []

    if (ruta && idAlumnaAsignada) {
      // LIDER: proyectos de su ruta asignada O donde es miembro del equipo
      valores.push(ruta)
      valores.push(idAlumnaAsignada)
      condiciones.push(
        `(p.ruta = $${valores.length - 1} OR EXISTS ` +
        `(SELECT 1 FROM proyecto_asignadas pax WHERE pax.id_proyecto = p.id AND pax.id_alumna = $${valores.length}))`
      )
    } else if (ruta) {
      valores.push(ruta)
      condiciones.push(`p.ruta = $${valores.length}`)
    }

    if (estado) {
      valores.push(estado)
      condiciones.push(`p.estado = $${valores.length}`)
    }
    if (soloPublicosYPropios && idPostulante) {
      valores.push(idPostulante)
      const idx = valores.length
      // Alumna ve: sus proyectos, los públicos, o aquellos en que es miembro
      condiciones.push(
        `(p.estado IN ('APROBADO', 'FINALIZADO') OR p.id_postulante = $${idx} OR EXISTS ` +
        `(SELECT 1 FROM proyecto_asignadas pax WHERE pax.id_proyecto = p.id AND pax.id_alumna = $${idx}))`
      )
    }

    const where = condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : ''

    const { rows } = await pool.query(
      `${BASE_SELECT} ${where} GROUP BY p.id, l.id, po.id ORDER BY p.creado_en DESC`,
      valores
    )
    return rows
  },

  /*
   * Obtener un proyecto por ID con miembros asignados.
   */
  async buscarPorId(id) {
    const { rows } = await pool.query(
      `${BASE_SELECT} WHERE p.id = $1 GROUP BY p.id, l.id, po.id`,
      [id]
    )
    return rows[0] ?? null
  },

  /*
   * Verificar si una alumna es miembro del proyecto.
   */
  async estaAsignada(idProyecto, idAlumna) {
    const { rows } = await pool.query(
      `SELECT 1 FROM proyecto_asignadas WHERE id_proyecto = $1 AND id_alumna = $2`,
      [idProyecto, idAlumna]
    )
    return rows.length > 0
  },

  /*
   * Crear una nueva postulación (estado inicial: PENDIENTE).
   */
  async crear({ nombre, descripcion, ruta, idPostulante, idSede }) {
    const { rows } = await pool.query(`
      INSERT INTO proyectos (nombre, descripcion, ruta, id_postulante, id_sede)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [nombre, descripcion ?? null, ruta, idPostulante, idSede ?? null])
    return this.buscarPorId(rows[0].id)
  },

  /*
   * Cambiar el estado del proyecto (ADMIN).
   */
  async actualizarEstado(id, estado) {
    const { rows } = await pool.query(`
      UPDATE proyectos SET estado = $1 WHERE id = $2 RETURNING id
    `, [estado, id])
    return rows[0] ? this.buscarPorId(id) : null
  },

  /*
   * Reemplazar lista completa de miembros asignados al proyecto.
   */
  async actualizarAsignadas(id, idsAlumnas) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(`DELETE FROM proyecto_asignadas WHERE id_proyecto = $1`, [id])
      for (const idAlumna of idsAlumnas) {
        await client.query(
          `INSERT INTO proyecto_asignadas (id_proyecto, id_alumna) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, idAlumna]
        )
      }
      await client.query('COMMIT')
      return this.buscarPorId(id)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  /*
   * Listar las tareas del proyecto con múltiples asignadas.
   */
  async listarTareas(idProyecto) {
    const { rows } = await pool.query(`
      SELECT
        t.id, t.titulo, t.descripcion, t.prioridad, t.estado, t.ruta,
        t.lecciones, t.creado_en, t.actualizado_en,
        t.id_creada_por,
        c.nombre AS nombre_creadora,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', al.id, 'nombre', al.nombre)
            ORDER BY al.nombre
          ) FILTER (WHERE al.id IS NOT NULL),
          '[]'::json
        ) AS asignadas
      FROM tareas t
      JOIN alumnas c ON c.id = t.id_creada_por
      LEFT JOIN tarea_asignadas ta ON ta.id_tarea = t.id
      LEFT JOIN alumnas al         ON al.id = ta.id_alumna
      WHERE t.id_proyecto = $1
      GROUP BY t.id, c.id
      ORDER BY
        CASE t.estado
          WHEN 'EN_PROGRESO' THEN 1
          WHEN 'PENDIENTE'   THEN 2
          WHEN 'COMPLETADA'  THEN 3
        END, t.creado_en DESC
    `, [idProyecto])
    return rows
  },

  /*
   * Actualizar nombre, descripcion y/o ruta del proyecto.
   * Permitido a: postulante, miembros del equipo, ADMIN.
   */
  async actualizar(id, { nombre, descripcion, ruta }) {
    const sets    = []
    const valores = []

    if (nombre !== undefined) {
      valores.push(nombre)
      sets.push(`nombre = $${valores.length}`)
    }
    if (descripcion !== undefined) {
      valores.push(descripcion)
      sets.push(`descripcion = $${valores.length}`)
    }
    if (ruta !== undefined) {
      valores.push(ruta)
      sets.push(`ruta = $${valores.length}`)
    }
    if (sets.length === 0) return this.buscarPorId(id)

    valores.push(id)
    await pool.query(
      `UPDATE proyectos SET ${sets.join(', ')} WHERE id = $${valores.length}`,
      valores
    )
    return this.buscarPorId(id)
  },

  /*
   * Asignar o reasignar la líder principal del proyecto (ADMIN).
   */
  async asignarLider(id, idLider) {
    const { rows } = await pool.query(`
      UPDATE proyectos SET id_lider = $1 WHERE id = $2 RETURNING id
    `, [idLider ?? null, id])
    return rows[0] ? this.buscarPorId(id) : null
  },

  async actualizarPostulante(id, idPostulante) {
    const { rows } = await pool.query(`
      UPDATE proyectos SET id_postulante = $1 WHERE id = $2 RETURNING id
    `, [idPostulante, id])
    return rows[0] ? this.buscarPorId(id) : null
  },

  async eliminar(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM proyectos WHERE id = $1`, [id]
    )
    return rowCount > 0
  },

}

module.exports = Proyecto
