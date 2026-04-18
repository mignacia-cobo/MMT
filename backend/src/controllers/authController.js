/*
 * ============================================================
 * controllers/authController.js  —  Lógica de autenticación
 * ============================================================
 *
 * Este controlador maneja dos acciones:
 *   - registrar: crear una cuenta nueva
 *   - login:     verificar credenciales y entregar token
 *
 * FLUJO DE REGISTRO:
 *   Alumna envía datos → validamos → ciframos pass → guardamos en BD → devolvemos token
 *
 * FLUJO DE LOGIN:
 *   Alumna envía email+pass → buscamos en BD → comparamos hash → devolvemos token
 */

const Alumna        = require('../models/Alumna')
const { generarToken } = require('../middleware/auth')

/*
 * POST /api/auth/registrar
 * Crea una cuenta nueva para la alumna.
 */
exports.registrar = async (req, res) => {
  try {
    const { nombre, email, password, carrera, idSede } = req.body

    if (!nombre || !email || !password) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Nombre, email y contraseña son obligatorios.',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        ok: false,
        mensaje: 'La contraseña debe tener al menos 6 caracteres.',
      })
    }

    const existente = await Alumna.buscarPorEmail(email)
    if (existente) {
      return res.status(409).json({
        ok: false,
        mensaje: 'Este email ya está registrado. ¿Quieres iniciar sesión?',
      })
    }

    const alumna = await Alumna.registrar({
      nombre, email, password, carrera,
      idSede: idSede ? Number(idSede) : null,
    })

    const token = generarToken(alumna)

    res.status(201).json({
      ok: true,
      mensaje: `¡Bienvenida al MMT Valpo Hub, ${alumna.nombre}!`,
      token,
      alumna,
    })
  } catch (error) {
    console.error('Error en registrar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al crear la cuenta.' })
  }
}

/*
 * POST /api/auth/login
 * Verifica credenciales y devuelve un token de sesión.
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Email y contraseña son obligatorios.',
      })
    }

    // Buscamos la alumna (incluye el hash de la contraseña)
    const alumna = await Alumna.buscarPorEmail(email)
    if (!alumna) {
      return res.status(401).json({
        ok: false,
        // Mensaje genérico a propósito → no revelamos si el email existe
        mensaje: 'Credenciales incorrectas.',
      })
    }

    // Comparamos la contraseña ingresada con el hash guardado
    const passwordCorrecta = await Alumna.verificarPassword(password, alumna.password_hash)
    if (!passwordCorrecta) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Credenciales incorrectas.',
      })
    }

    // Obtenemos el objeto completo (incluye nombre_sede via JOIN)
    const alumnaCompleta = await Alumna.buscarPorId(alumna.id)
    const token = generarToken(alumnaCompleta)

    res.json({
      ok: true,
      mensaje: `¡Hola de nuevo, ${alumna.nombre}!`,
      token,
      alumna: alumnaCompleta,
    })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar sesión.' })
  }
}

/*
 * GET /api/auth/yo
 * Devuelve los datos de la alumna autenticada actualmente.
 * Requiere el middleware verificarSesion.
 */
/*
 * PATCH /api/auth/perfil
 * La alumna actualiza su propio nombre y carrera.
 */
exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, carrera } = req.body
    if (nombre !== undefined && !nombre?.trim()) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre no puede estar vacío.' })
    }
    const alumna = await Alumna.actualizarPerfil(req.usuaria.id, {
      nombre:  nombre?.trim()  ?? null,
      carrera: carrera?.trim() ?? null,
    })
    res.json({ ok: true, alumna })
  } catch (error) {
    console.error('Error en actualizarPerfil:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el perfil.' })
  }
}

/*
 * PATCH /api/auth/avatar
 * La alumna sube una nueva imagen de perfil (Multer).
 */
exports.actualizarAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, mensaje: 'No se envió ninguna imagen.' })
    }
    const avatarUrl = `/uploads/${req.file.filename}`
    const alumna = await Alumna.actualizarPerfil(req.usuaria.id, { avatarUrl })
    res.json({ ok: true, alumna, avatarUrl })
  } catch (error) {
    console.error('Error en actualizarAvatar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el avatar.' })
  }
}

exports.yo = async (req, res) => {
  try {
    // req.usuaria.id viene del token verificado por el middleware
    const alumna = await Alumna.buscarPorId(req.usuaria.id)
    if (!alumna) {
      return res.status(404).json({ ok: false, mensaje: 'Usuaria no encontrada.' })
    }
    res.json({ ok: true, alumna })
  } catch (error) {
    console.error('Error en yo:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener tu perfil.' })
  }
}
