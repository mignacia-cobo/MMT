/*
 * ============================================================
 * models/Asignatura.js  —  Modelo de datos de asignaturas
 * ============================================================
 *
 * Las asignaturas son las categorías bajo las que se organizan
 * los materiales del repositorio.
 *
 * TABLA EN BD: subjects
 *   id | nombre | codigo | descripcion | activa
 */

const { pool } = require('../config/db')

const Asignatura = {

  /*
   * Devuelve todas las asignaturas activas.
   * Se usa para poblar el select en el formulario de subida.
   */
  async listarActivas() {
    const { rows } = await pool.query(
      `SELECT id, nombre, codigo, descripcion
       FROM asignaturas
       WHERE activa = TRUE
       ORDER BY nombre ASC`
    )
    return rows
  },

  /*
   * Devuelve una asignatura por su ID.
   */
  async buscarPorId(id) {
    const { rows } = await pool.query(
      `SELECT * FROM asignaturas WHERE id = $1`,
      [id]
    )
    return rows[0] ?? null
  },

  /*
   * Crea una nueva asignatura.
   */
  async crear({ nombre, codigo, descripcion }) {
    const { rows } = await pool.query(
      `INSERT INTO asignaturas (nombre, codigo, descripcion)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nombre.trim(), codigo?.trim().toUpperCase() ?? null, descripcion ?? null]
    )
    return rows[0]
  },

  async listar() {
    const { rows } = await pool.query(`
      SELECT a.id, a.nombre, a.codigo, a.descripcion, a.activa,
             COUNT(m.id)::integer AS total_materiales
      FROM asignaturas a
      LEFT JOIN materiales m ON m.id_asignatura = a.id
      GROUP BY a.id
      ORDER BY a.nombre ASC
    `)
    return rows
  },

  async actualizar(id, { nombre, codigo, descripcion, activa }) {
    const { rows } = await pool.query(`
      UPDATE asignaturas
      SET nombre      = COALESCE($1, nombre),
          codigo      = COALESCE($2, codigo),
          descripcion = COALESCE($3, descripcion),
          activa      = COALESCE($4, activa)
      WHERE id = $5
      RETURNING *
    `, [nombre ?? null, codigo?.toUpperCase() ?? null, descripcion ?? null, activa ?? null, id])
    return rows[0] ?? null
  },

}

module.exports = Asignatura
