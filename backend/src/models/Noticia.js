/*
 * ============================================================
 * models/Noticia.js  —  Modelo de datos de noticias MMT
 * ============================================================
 *
 * TABLAS: noticias, comentarios_noticias, likes_noticias
 */

const { pool } = require('../config/db')

const Noticia = {

  /*
   * Listar todas las noticias publicadas con contadores de likes y comentarios.
   * Pública — no requiere autenticación.
   */
  async listar({ idSede = null } = {}) {
    const filtroSede = idSede ? `AND n.id_sede = $1` : ''
    const params     = idSede ? [idSede] : []
    const { rows } = await pool.query(`
      SELECT
        n.id, n.titulo, n.contenido, n.imagen_url, n.publicada, n.id_sede, n.creado_en,
        a.id   AS id_autora,
        a.nombre AS nombre_autora,
        CAST(COUNT(DISTINCT l.id_alumna) AS INTEGER) AS likes,
        CAST(COUNT(DISTINCT c.id)        AS INTEGER) AS comentarios
      FROM noticias n
      JOIN alumnas a ON a.id = n.id_autora
      LEFT JOIN likes_noticias        l ON l.id_noticia = n.id
      LEFT JOIN comentarios_noticias  c ON c.id_noticia = n.id
      WHERE n.publicada = TRUE ${filtroSede}
      GROUP BY n.id, a.id
      ORDER BY n.creado_en DESC
    `, params)
    return rows
  },

  /*
   * Detalle de una noticia.
   * Si se pasa idAlumna, incluye me_gusta (boolean).
   */
  async buscarPorId(id, idAlumna = null) {
    const { rows } = await pool.query(`
      SELECT
        n.id, n.titulo, n.contenido, n.imagen_url, n.publicada,
        n.creado_en, n.actualizado_en,
        a.id   AS id_autora,
        a.nombre AS nombre_autora,
        CAST(COUNT(DISTINCT l.id_alumna) AS INTEGER) AS likes,
        CAST(COUNT(DISTINCT c.id)        AS INTEGER) AS comentarios,
        CASE WHEN $2::integer IS NOT NULL
             THEN EXISTS(
               SELECT 1 FROM likes_noticias ln
               WHERE ln.id_noticia = n.id AND ln.id_alumna = $2::integer
             )
             ELSE FALSE
        END AS me_gusta
      FROM noticias n
      JOIN alumnas a ON a.id = n.id_autora
      LEFT JOIN likes_noticias        l ON l.id_noticia = n.id
      LEFT JOIN comentarios_noticias  c ON c.id_noticia = n.id
      WHERE n.id = $1
      GROUP BY n.id, a.id
    `, [id, idAlumna])
    return rows[0] ?? null
  },

  /*
   * Crear una noticia nueva (ADMIN).
   * Empieza no publicada; el admin la publica con actualizar().
   */
  async crear({ titulo, contenido, imagenUrl, idAutora, idSede = null }) {
    const { rows } = await pool.query(`
      INSERT INTO noticias (titulo, contenido, imagen_url, id_autora, id_sede)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [titulo, contenido, imagenUrl ?? null, idAutora, idSede])
    return rows[0]
  },

  /*
   * Actualizar datos o publicar/despublicar (ADMIN).
   * Solo actualiza los campos que llegan. id_sede admite null explícito para limpiarla.
   */
  async actualizar(id, params) {
    const { titulo, contenido, imagenUrl, publicada } = params
    const sets = []
    const vals = []
    let i = 1

    if (titulo    !== undefined) { sets.push(`titulo     = $${i++}`); vals.push(titulo) }
    if (contenido !== undefined) { sets.push(`contenido  = $${i++}`); vals.push(contenido) }
    if (imagenUrl !== undefined) { sets.push(`imagen_url = $${i++}`); vals.push(imagenUrl) }
    if (publicada !== undefined) { sets.push(`publicada  = $${i++}`); vals.push(publicada) }
    if ('idSede' in params)      { sets.push(`id_sede    = $${i++}`); vals.push(params.idSede ?? null) }

    if (sets.length === 0) return this.buscarPorId(id)

    sets.push(`actualizado_en = NOW()`)
    vals.push(id)

    const { rows } = await pool.query(
      `UPDATE noticias SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      vals
    )
    return rows[0] ?? null
  },

  /*
   * Eliminar una noticia (ADMIN). Cascadea comentarios y likes.
   */
  async eliminar(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM noticias WHERE id = $1`, [id]
    )
    return rowCount > 0
  },

  /*
   * Toggle like: si ya existe lo elimina (unlike), si no existe lo crea (like).
   * Devuelve true si quedó liked, false si quedó unliked.
   */
  async toggleLike(idNoticia, idAlumna) {
    const { rows } = await pool.query(
      `SELECT 1 FROM likes_noticias WHERE id_noticia = $1 AND id_alumna = $2`,
      [idNoticia, idAlumna]
    )
    if (rows.length > 0) {
      await pool.query(
        `DELETE FROM likes_noticias WHERE id_noticia = $1 AND id_alumna = $2`,
        [idNoticia, idAlumna]
      )
      return false
    }
    await pool.query(
      `INSERT INTO likes_noticias (id_noticia, id_alumna) VALUES ($1, $2)`,
      [idNoticia, idAlumna]
    )
    return true
  },

  /*
   * Listar comentarios de una noticia con nombre de autora.
   */
  async listarComentarios(idNoticia) {
    const { rows } = await pool.query(`
      SELECT cn.id, cn.contenido, cn.creado_en,
             a.id   AS id_alumna,
             a.nombre AS nombre_alumna
      FROM comentarios_noticias cn
      JOIN alumnas a ON a.id = cn.id_alumna
      WHERE cn.id_noticia = $1
      ORDER BY cn.creado_en ASC
    `, [idNoticia])
    return rows
  },

  /*
   * Agregar un comentario a una noticia.
   */
  async agregarComentario({ idNoticia, idAlumna, contenido }) {
    const { rows } = await pool.query(`
      INSERT INTO comentarios_noticias (id_noticia, id_alumna, contenido)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [idNoticia, idAlumna, contenido])
    return rows[0]
  },

}

module.exports = Noticia
