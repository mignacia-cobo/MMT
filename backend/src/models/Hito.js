/*
 * ============================================================
 * models/Hito.js  —  Modelo de hitos del cronograma MMT 2026
 * ============================================================
 *
 * TABLA: hitos
 *   id, titulo, descripcion, fecha, tipo (PASADO|ACTUAL|FUTURO), orden
 */

const { pool } = require('../config/db')

const Hito = {

  async listar() {
    const { rows } = await pool.query(`
      SELECT id, titulo, descripcion, fecha, tipo, orden
      FROM hitos
      ORDER BY fecha ASC, orden ASC
    `)
    return rows
  },

  async crear({ titulo, descripcion, fecha, tipo, orden }) {
    const { rows } = await pool.query(`
      INSERT INTO hitos (titulo, descripcion, fecha, tipo, orden)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [titulo, descripcion ?? null, fecha, tipo ?? 'FUTURO', orden ?? 0])
    return rows[0]
  },

  async actualizar(id, { titulo, descripcion, fecha, tipo, orden }) {
    const { rows } = await pool.query(`
      UPDATE hitos
      SET titulo      = COALESCE($1, titulo),
          descripcion = COALESCE($2, descripcion),
          fecha       = COALESCE($3, fecha),
          tipo        = COALESCE($4, tipo),
          orden       = COALESCE($5, orden)
      WHERE id = $6
      RETURNING *
    `, [titulo ?? null, descripcion ?? null, fecha ?? null, tipo ?? null, orden ?? null, id])
    return rows[0] ?? null
  },

  async eliminar(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM hitos WHERE id = $1`, [id]
    )
    return rowCount > 0
  },

  /*
   * Listar hitos con sus tareas asociadas.
   */
  async listarConTareas() {
    const hitos = await this.listar()
    const { rows: tareas } = await pool.query(`
      SELECT
        t.id, t.titulo, t.prioridad, t.estado, t.ruta, t.fecha_limite,
        t.id_hito,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', al.id, 'nombre', al.nombre)
            ORDER BY al.nombre
          ) FILTER (WHERE al.id IS NOT NULL),
          '[]'::json
        ) AS asignadas
      FROM tareas t
      LEFT JOIN tarea_asignadas ta ON ta.id_tarea = t.id
      LEFT JOIN alumnas al         ON al.id = ta.id_alumna
      WHERE t.id_hito IS NOT NULL
      GROUP BY t.id
      ORDER BY t.creado_en DESC
    `)

    const tareasPorHito = {}
    for (const t of tareas) {
      if (!tareasPorHito[t.id_hito]) tareasPorHito[t.id_hito] = []
      tareasPorHito[t.id_hito].push(t)
    }

    return hitos.map(h => ({ ...h, tareas: tareasPorHito[h.id] ?? [] }))
  },

  /*
   * Listar solo las tareas de un hito específico.
   */
  async listarTareas(idHito) {
    const { rows } = await pool.query(`
      SELECT
        t.id, t.titulo, t.prioridad, t.estado, t.ruta, t.fecha_limite,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', al.id, 'nombre', al.nombre)
            ORDER BY al.nombre
          ) FILTER (WHERE al.id IS NOT NULL),
          '[]'::json
        ) AS asignadas
      FROM tareas t
      LEFT JOIN tarea_asignadas ta ON ta.id_tarea = t.id
      LEFT JOIN alumnas al         ON al.id = ta.id_alumna
      WHERE t.id_hito = $1
      GROUP BY t.id
      ORDER BY t.fecha_limite ASC NULLS LAST, t.creado_en DESC
    `, [idHito])
    return rows
  },

}

module.exports = Hito
