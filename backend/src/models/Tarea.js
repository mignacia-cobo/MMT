/*
 * ============================================================
 * models/Tarea.js  —  Modelo de datos para tareas MMT
 * ============================================================
 *
 * TABLAS: tareas, tarea_asignadas, comentarios_tareas
 *
 * Las asignadas se almacenan en tarea_asignadas (N:N).
 * id_sede en tareas se hereda del creador al crear.
 */

const { pool } = require('../config/db')

// Query base reutilizada en listar y buscarPorId
const BASE_SELECT = `
  SELECT
    t.id, t.titulo, t.descripcion, t.prioridad, t.estado, t.ruta,
    t.lecciones, t.id_sede, t.creado_en, t.actualizado_en,
    t.fecha_limite,
    c.id     AS id_creada_por,
    c.nombre AS nombre_creadora,
    t.id_proyecto,
    pr.nombre AS nombre_proyecto,
    t.id_hito,
    hi.titulo AS titulo_hito,
    hi.fecha  AS fecha_hito,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT('id', al.id, 'nombre', al.nombre)
        ORDER BY al.nombre
      ) FILTER (WHERE al.id IS NOT NULL),
      '[]'::json
    ) AS asignadas
  FROM tareas t
  JOIN      alumnas   c  ON c.id  = t.id_creada_por
  LEFT JOIN proyectos pr ON pr.id = t.id_proyecto
  LEFT JOIN hitos     hi ON hi.id = t.id_hito
  LEFT JOIN tarea_asignadas ta ON ta.id_tarea = t.id
  LEFT JOIN alumnas   al ON al.id = ta.id_alumna
`

const Tarea = {

  /*
   * Listar tareas con filtros opcionales.
   * idSedes: array de IDs → solo esas sedes (null = todas).
   */
  async listar({ ruta, estado, idSedes = null } = {}) {
    const condiciones = []
    const valores     = []

    if (ruta) {
      valores.push(ruta)
      condiciones.push(`t.ruta = $${valores.length}`)
    }
    if (estado) {
      valores.push(estado)
      condiciones.push(`t.estado = $${valores.length}`)
    }
    if (idSedes && idSedes.length > 0) {
      valores.push(idSedes)
      condiciones.push(`(t.id_sede = ANY($${valores.length}::integer[]) OR t.id_sede IS NULL)`)
    }

    const where = condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : ''

    const { rows } = await pool.query(
      `${BASE_SELECT} ${where} GROUP BY t.id, c.id, pr.id, hi.id ORDER BY t.creado_en DESC`,
      valores
    )
    return rows
  },

  /*
   * Obtener una tarea por ID con asignadas y proyecto.
   */
  async buscarPorId(id) {
    const { rows } = await pool.query(
      `${BASE_SELECT} WHERE t.id = $1 GROUP BY t.id, c.id, pr.id, hi.id`,
      [id]
    )
    return rows[0] ?? null
  },

  /*
   * Verificar si una alumna está asignada a una tarea.
   */
  async estaAsignada(idTarea, idAlumna) {
    const { rows } = await pool.query(
      `SELECT 1 FROM tarea_asignadas WHERE id_tarea = $1 AND id_alumna = $2`,
      [idTarea, idAlumna]
    )
    return rows.length > 0
  },

  /*
   * Crear una tarea nueva con asignadas múltiples.
   * idsAsignadas: array de IDs de alumnas.
   * idSede: hereda del creador.
   */
  async crear({ titulo, descripcion, prioridad, ruta, idsAsignadas = [], idCreadaPor, idProyecto, idSede, idHito, fechaLimite }) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const { rows } = await client.query(`
        INSERT INTO tareas (titulo, descripcion, prioridad, ruta, id_creada_por, id_proyecto, id_sede, id_hito, fecha_limite)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [titulo, descripcion ?? null, prioridad, ruta, idCreadaPor, idProyecto ?? null, idSede ?? null, idHito ?? null, fechaLimite ?? null])

      const id = rows[0].id

      for (const idAlumna of idsAsignadas) {
        await client.query(
          `INSERT INTO tarea_asignadas (id_tarea, id_alumna) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
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
   * Actualizar campos de una tarea (titulo, descripcion, prioridad, ruta, lecciones, idProyecto).
   * Solo actualiza los campos presentes en params.
   */
  async actualizar(id, params) {
    const camposBD = {
      titulo:       'titulo',
      descripcion:  'descripcion',
      prioridad:    'prioridad',
      ruta:         'ruta',
      lecciones:    'lecciones',
      idProyecto:   'id_proyecto',
      idHito:       'id_hito',
      fechaLimite:  'fecha_limite',
      idCreadaPor:  'id_creada_por',
    }
    const sets = []
    const vals = []
    let i = 1

    for (const [campo, col] of Object.entries(camposBD)) {
      if (campo in params) {
        sets.push(`${col} = $${i++}`)
        vals.push(params[campo] ?? null)
      }
    }

    if (sets.length === 0) return this.buscarPorId(id)

    sets.push('actualizado_en = NOW()')
    vals.push(id)

    const { rows } = await pool.query(
      `UPDATE tareas SET ${sets.join(', ')} WHERE id = $${i} RETURNING id`,
      vals
    )
    return rows[0] ? this.buscarPorId(id) : null
  },

  /*
   * Reemplazar la lista completa de asignadas de una tarea.
   * idsAlumnas: array de IDs (puede ser vacío para dejar sin asignar).
   */
  async actualizarAsignadas(id, idsAlumnas) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(`DELETE FROM tarea_asignadas WHERE id_tarea = $1`, [id])
      for (const idAlumna of idsAlumnas) {
        await client.query(
          `INSERT INTO tarea_asignadas (id_tarea, id_alumna) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
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
   * Cambiar el estado de una tarea.
   */
  async cambiarEstado(id, { estado, lecciones }) {
    const { rows } = await pool.query(`
      UPDATE tareas
      SET estado         = $1,
          lecciones      = COALESCE($2, lecciones),
          actualizado_en = NOW()
      WHERE id = $3
      RETURNING *
    `, [estado, lecciones ?? null, id])
    return rows[0] ?? null
  },

  /*
   * Eliminar una tarea.
   * ADMIN puede eliminar cualquier tarea; LIDER solo las propias.
   */
  async eliminar(id, idAlumna, rol) {
    const resultado = rol === 'ADMIN'
      ? await pool.query(`DELETE FROM tareas WHERE id = $1 RETURNING id`, [id])
      : await pool.query(`DELETE FROM tareas WHERE id = $1 AND id_creada_por = $2 RETURNING id`, [id, idAlumna])
    return resultado.rowCount > 0
  },

  /*
   * Asociar o desasociar una tarea a un proyecto.
   */
  async asignarProyecto(id, idProyecto) {
    const { rows } = await pool.query(`
      UPDATE tareas SET id_proyecto = $1, actualizado_en = NOW() WHERE id = $2 RETURNING *
    `, [idProyecto ?? null, id])
    return rows[0] ?? null
  },

  /*
   * Agregar un comentario.
   */
  async agregarComentario({ idTarea, idAlumna, contenido }) {
    const { rows } = await pool.query(`
      INSERT INTO comentarios_tareas (id_tarea, id_alumna, contenido)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [idTarea, idAlumna, contenido])
    return rows[0]
  },

  /*
   * Listar comentarios de una tarea con nombre de autora.
   */
  async listarComentarios(idTarea) {
    const { rows } = await pool.query(`
      SELECT ct.id, ct.contenido, ct.creado_en,
             al.id AS id_alumna, al.nombre AS nombre_alumna, al.avatar_url
      FROM comentarios_tareas ct
      JOIN alumnas al ON al.id = ct.id_alumna
      WHERE ct.id_tarea = $1
      ORDER BY ct.creado_en ASC
    `, [idTarea])
    return rows
  },

}

module.exports = Tarea

