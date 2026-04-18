/*
 * =====================================================================
 * models/Material.js  —  Modelo de datos para materiales del repositorio
 * =====================================================================
 *
 * Contiene todas las consultas SQL para manejar materiales.
 *
 * CONCEPTOS DE SQL QUE SE USAN AQUÍ:
 *
 *   - PARÁMETROS ($1, $2...) → previenen inyección SQL.
 *     Ejemplo: WHERE id = $1 es seguro; WHERE id = ${id} NO lo es.
 *
 *   - ILIKE → búsqueda de texto sin importar mayúsculas/minúsculas.
 *     Ejemplo: 'Python' y 'python' dan el mismo resultado.
 *
 *   - COALESCE(valor, alternativa) → si valor es NULL, usa la alternativa.
 *     Útil para actualizar solo los campos que el usuario envió.
 *
 *   - JOIN → combina filas de dos tablas relacionadas.
 *     Aquí unimos materiales + asignaturas + alumnas.
 */

const { pool } = require('../config/db')

const Material = {

  /*
   * ----------------------------------------------------------
   * LISTAR MATERIALES con filtros opcionales
   * ----------------------------------------------------------
   * Se usa en la página de repositorio (galería de materiales).
   *
   * Parámetros de búsqueda (todos opcionales):
   *   idAsignatura → filtrar por asignatura
   *   idAlumna     → filtrar por autora
   *   busqueda     → buscar por texto en el título
   *   limite       → cuántos resultados por página (paginación)
   *   desplazamiento → cuántos resultados saltar (paginación)
   */
  async listar({ idAsignatura, idAlumna, busqueda, limite = 20, desplazamiento = 0 } = {}) {
    // Construimos los filtros dinámicamente según los parámetros recibidos
    const condiciones = []
    const valores     = []

    if (idAsignatura) {
      valores.push(idAsignatura)
      condiciones.push(`m.id_asignatura = $${valores.length}`)
    }
    if (idAlumna) {
      valores.push(idAlumna)
      condiciones.push(`m.id_alumna = $${valores.length}`)
    }
    if (busqueda) {
      valores.push(`%${busqueda}%`)
      condiciones.push(`m.titulo ILIKE $${valores.length}`)
    }

    // Si hay condiciones, las unimos con AND; si no, no hay cláusula WHERE
    const clausulaWhere = condiciones.length
      ? 'WHERE ' + condiciones.join(' AND ')
      : ''

    valores.push(limite, desplazamiento)
    const posLimite = valores.length - 1
    const posDespl  = valores.length

    const { rows } = await pool.query(`
      SELECT
        m.id,
        m.titulo,
        m.descripcion,
        m.nombre_archivo,
        m.url_archivo,
        m.tipo_archivo,
        m.descargas,
        m.codigo_html,
        m.creado_en,
        a.id     AS id_asignatura,
        a.nombre AS nombre_asignatura,
        al.id    AS id_alumna,
        al.nombre AS nombre_alumna,
        al.carrera AS carrera_alumna,
        al.avatar_url
      FROM materiales m
      JOIN asignaturas a  ON a.id  = m.id_asignatura
      JOIN alumnas     al ON al.id = m.id_alumna
      ${clausulaWhere}
      ORDER BY m.creado_en DESC
      LIMIT $${posLimite} OFFSET $${posDespl}
    `, valores)

    return rows
  },

  /*
   * ----------------------------------------------------------
   * BUSCAR UN MATERIAL POR ID
   * ----------------------------------------------------------
   * Usa la vista para traer todos los datos en una consulta.
   */
  async buscarPorId(id) {
    const { rows } = await pool.query(
      `SELECT * FROM vista_materiales_completa WHERE id = $1`,
      [id]
    )
    return rows[0] ?? null
  },

  /*
   * ----------------------------------------------------------
   * CREAR UN NUEVO MATERIAL
   * ----------------------------------------------------------
   * Llamado después de que Multer guardó el archivo en disco.
   */
  async crear({ titulo, descripcion, nombreArchivo, urlArchivo, tamanoByte, tipoArchivo, idAsignatura, idAlumna, codigoHtml }) {
    const { rows } = await pool.query(`
      INSERT INTO materiales
        (titulo, descripcion, nombre_archivo, url_archivo, tamano_bytes, tipo_archivo, id_asignatura, id_alumna, codigo_html)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [titulo, descripcion, nombreArchivo, urlArchivo, tamanoByte, tipoArchivo, idAsignatura, idAlumna, codigoHtml ?? null])

    return rows[0]
  },

  /*
   * ----------------------------------------------------------
   * ACTUALIZAR CÓDIGO HTML (solo la autora)
   * ----------------------------------------------------------
   */
  async actualizarCodigo(id, idAlumna, codigoHtml) {
    const { rows } = await pool.query(
      `UPDATE materiales SET codigo_html = $1 WHERE id = $2 AND id_alumna = $3 RETURNING id`,
      [codigoHtml ?? null, id, idAlumna]
    )
    return rows[0] ?? null
  },

  /*
   * ----------------------------------------------------------
   * REGISTRAR UNA DESCARGA
   * ----------------------------------------------------------
   * Incrementa el contador cada vez que alguien descarga el material.
   */
  async registrarDescarga(id) {
    await pool.query(
      `UPDATE materiales SET descargas = descargas + 1 WHERE id = $1`,
      [id]
    )
  },

  /*
   * ----------------------------------------------------------
   * ELIMINAR UN MATERIAL
   * ----------------------------------------------------------
   * Solo la alumna autora puede eliminar su propio material.
   * Verificamos ambas condiciones (id del material + id de la autora).
   */
  /*
   * ADMIN puede eliminar cualquier material de sus sedes (o todos si sin restricción).
   * idSedesPermitidas: array → solo alumnas de esas sedes; null → sin restricción.
   */
  async eliminar(id, idAlumna, { esAdmin = false, idSedesPermitidas = null } = {}) {
    if (esAdmin) {
      if (idSedesPermitidas && idSedesPermitidas.length > 0) {
        const { rowCount } = await pool.query(`
          DELETE FROM materiales m
          WHERE m.id = $1
            AND EXISTS (
              SELECT 1 FROM alumnas a WHERE a.id = m.id_alumna
              AND a.id_sede = ANY($2::integer[])
            )
        `, [id, idSedesPermitidas])
        return rowCount > 0
      }
      const { rowCount } = await pool.query(`DELETE FROM materiales WHERE id = $1`, [id])
      return rowCount > 0
    }
    const { rowCount } = await pool.query(
      `DELETE FROM materiales WHERE id = $1 AND id_alumna = $2`,
      [id, idAlumna]
    )
    return rowCount > 0
  },

  /*
   * ----------------------------------------------------------
   * LISTAR MATERIALES DE UNA ALUMNA (para su perfil)
   * ----------------------------------------------------------
   */
  async listarPorAlumna(idAlumna) {
    return this.listar({ idAlumna, limite: 100 })
  },

}

module.exports = Material
