const { pool } = require('../config/db')

const Sede = {

  async listar() {
    const { rows } = await pool.query(`
      SELECT s.id, s.nombre, s.ciudad, s.activa, s.creado_en,
             COUNT(a.id)::integer AS total_alumnas
      FROM sedes s
      LEFT JOIN alumnas a ON a.id_sede = s.id
      GROUP BY s.id
      ORDER BY s.nombre ASC
    `)
    return rows
  },

  async listarActivas() {
    const { rows } = await pool.query(
      `SELECT id, nombre, ciudad FROM sedes WHERE activa = TRUE ORDER BY nombre ASC`
    )
    return rows
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(`SELECT * FROM sedes WHERE id = $1`, [id])
    return rows[0] ?? null
  },

  async crear({ nombre, ciudad }) {
    const { rows } = await pool.query(
      `INSERT INTO sedes (nombre, ciudad) VALUES ($1, $2) RETURNING *`,
      [nombre.trim(), ciudad.trim()]
    )
    return rows[0]
  },

  async actualizar(id, { nombre, ciudad, activa }) {
    const { rows } = await pool.query(`
      UPDATE sedes
      SET nombre = COALESCE($1, nombre),
          ciudad = COALESCE($2, ciudad),
          activa = COALESCE($3, activa)
      WHERE id = $4
      RETURNING *
    `, [nombre ?? null, ciudad ?? null, activa ?? null, id])
    return rows[0] ?? null
  },

  async eliminar(id) {
    const { rowCount } = await pool.query(`DELETE FROM sedes WHERE id = $1`, [id])
    return rowCount > 0
  },
}

module.exports = Sede
