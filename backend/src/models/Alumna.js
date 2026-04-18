/*
 * ============================================================
 * models/Alumna.js  —  Modelo de datos de las alumnas MMT
 * ============================================================
 *
 * Este archivo define todas las operaciones de base de datos
 * relacionadas con las alumnas del programa.
 *
 * CONCEPTO CLAVE — Modelo en MVC:
 *   El "Modelo" es la capa que habla directamente con la base de datos.
 *   No sabe nada de la web, solo maneja datos.
 *   El Controlador le pide datos → el Modelo los busca y devuelve.
 *
 * TABLA EN BD: students
 *   id | nombre | email | carrera | anio_cohorte | avatar_url | creado_en
 */

const { pool } = require('../config/db')
const bcrypt   = require('bcrypt')

// Cuántas rondas de cifrado se aplican a las contraseñas.
// 10 es el equilibrio recomendado entre seguridad y velocidad.
const RONDAS_HASH = 10

const Alumna = {

  /*
   * ----------------------------------------------------------
   * BUSCAR UNA ALUMNA POR ID
   * ----------------------------------------------------------
   * Se usa cuando la alumna ya inició sesión y queremos mostrar
   * su perfil o verificar que existe.
   *
   * $1 es un parámetro seguro (evita inyección SQL).
   */
  async buscarPorId(id) {
    const { rows } = await pool.query(
      `SELECT a.id, a.nombre, a.email, a.carrera, a.anio_cohorte, a.avatar_url,
              a.rol, a.ruta_asignada, a.id_sede, a.creado_en,
              s.nombre AS nombre_sede
       FROM alumnas a
       LEFT JOIN sedes s ON s.id = a.id_sede
       WHERE a.id = $1`,
      [id]
    )
    return rows[0] ?? null
  },

  /*
   * ----------------------------------------------------------
   * BUSCAR UNA ALUMNA POR EMAIL
   * ----------------------------------------------------------
   * Se usa en el login para verificar que el email existe.
   * NOTA: aquí SÍ devolvemos la contraseña cifrada porque
   * el controlador de login la necesita para comparar.
   */
  async buscarPorEmail(email) {
    const { rows } = await pool.query(
      `SELECT * FROM alumnas WHERE email = $1`,
      [email.toLowerCase().trim()]
    )
    return rows[0] ?? null
  },

  /*
   * ----------------------------------------------------------
   * REGISTRAR UNA NUEVA ALUMNA
   * ----------------------------------------------------------
   * Pasos:
   *   1. Ciframos la contraseña con bcrypt (NUNCA se guarda en texto plano)
   *   2. Insertamos en la BD
   *   3. Devolvemos los datos SIN la contraseña
   */
  async registrar({ nombre, email, password, carrera, anioCohorte = 2026, idSede = null }) {
    const passwordCifrado = await bcrypt.hash(password, RONDAS_HASH)

    const { rows } = await pool.query(
      `INSERT INTO alumnas (nombre, email, password_hash, carrera, anio_cohorte, id_sede)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [nombre.trim(), email.toLowerCase().trim(), passwordCifrado, carrera, anioCohorte, idSede]
    )

    return this.buscarPorId(rows[0].id)
  },

  /*
   * ----------------------------------------------------------
   * VERIFICAR CONTRASEÑA EN EL LOGIN
   * ----------------------------------------------------------
   * bcrypt.compare compara el texto plano con el hash guardado.
   * Devuelve true si coinciden, false si no.
   */
  async verificarPassword(passwordIngresado, hashGuardado) {
    return bcrypt.compare(passwordIngresado, hashGuardado)
  },

  /*
   * ----------------------------------------------------------
   * LISTAR TODAS LAS ALUMNAS (uso admin)
   * ----------------------------------------------------------
   */
  async listarTodas() {
    const { rows } = await pool.query(
      `SELECT id, nombre, email, carrera, anio_cohorte, creado_en
       FROM alumnas
       ORDER BY nombre ASC`
    )
    return rows
  },

  /*
   * ----------------------------------------------------------
   * ACTUALIZAR PERFIL
   * ----------------------------------------------------------
   */
  async actualizarPerfil(id, { nombre, carrera, avatarUrl }) {
    await pool.query(
      `UPDATE alumnas
       SET nombre     = COALESCE($1, nombre),
           carrera    = COALESCE($2, carrera),
           avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4`,
      [nombre ?? null, carrera ?? null, avatarUrl ?? null, id]
    )
    return this.buscarPorId(id)
  },

}

module.exports = Alumna
