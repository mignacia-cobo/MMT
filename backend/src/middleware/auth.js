/*
 * ============================================================
 * middleware/auth.js  —  Verificación de sesión de la alumna
 * ============================================================
 *
 * Este middleware protege las rutas que requieren que la alumna
 * haya iniciado sesión. Si el token es válido, adjunta los datos
 * de la usuaria al objeto `req.usuaria` para que los controladores
 * puedan usarlos.
 *
 * CÓMO FUNCIONA:
 *   1. El cliente envía el token en la cabecera: Authorization: Bearer <token>
 *   2. Este middleware verifica que el token sea válido con JWT
 *   3. Si es válido → pasa al siguiente controlador (next())
 *   4. Si no es válido → responde con error 401 (No autorizado)
 *
 * PARA LAS ALUMNAS:
 *   Un token JWT es como un "pase de entrada" digital.
 *   El servidor lo genera cuando haces login y tú lo guardas
 *   en el navegador. Cada vez que haces una petición privada,
 *   lo envías para demostrar quién eres.
 */

const jwt = require('jsonwebtoken')

// Clave secreta usada para firmar y verificar los tokens.
// En producción SIEMPRE debe estar en variables de entorno (.env).
const CLAVE_SECRETA = process.env.JWT_SECRET || 'mmt-valpo-dev-secret-2026'

/**
 * Middleware principal — verifica que la alumna esté autenticada.
 *
 * @param {import('express').Request}  req  - Petición HTTP entrante
 * @param {import('express').Response} res  - Respuesta HTTP
 * @param {Function}                   next - Siguiente función en la cadena
 */
function verificarSesion(req, res, next) {
  // Buscamos la cabecera de autorización
  const cabecera = req.headers['authorization']

  // Si no hay cabecera, la alumna no envió su token → rechazamos
  if (!cabecera || !cabecera.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      mensaje: 'Debes iniciar sesión para acceder a este recurso.',
    })
  }

  // Extraemos el token (quitamos el prefijo "Bearer ")
  const token = cabecera.split(' ')[1]

  try {
    // jwt.verify lanza un error si el token es inválido o expiró
    const datos = jwt.verify(token, CLAVE_SECRETA)

    // Adjuntamos los datos de la alumna a la petición
    // Los controladores pueden acceder a req.usuaria.id, req.usuaria.nombre, etc.
    req.usuaria = datos

    next() // ✓ Token válido → continuar
  } catch {
    return res.status(401).json({
      ok: false,
      mensaje: 'Sesión inválida o expirada. Vuelve a iniciar sesión.',
    })
  }
}

/**
 * Genera un token JWT para la alumna que acaba de hacer login.
 *
 * @param {{ id: number, nombre: string, email: string }} alumna
 * @returns {string} Token firmado con expiración de 7 días
 */
function generarToken(alumna) {
  return jwt.sign(
    {
      id:            alumna.id,
      nombre:        alumna.nombre,
      email:         alumna.email,
      rol:           alumna.rol,
      ruta_asignada: alumna.ruta_asignada ?? null,
      id_sede:       alumna.id_sede ?? null,
    },
    CLAVE_SECRETA,
    { expiresIn: '7d' }
  )
}

/**
 * Fábrica de middleware — restringe el acceso a los roles indicados.
 * Debe usarse DESPUÉS de verificarSesion en la cadena de middlewares.
 *
 * Ejemplo: router.delete('/:id', verificarSesion, verificarRol('ADMIN'), ctrl.eliminar)
 *
 * @param {...string} roles - Roles permitidos ('ADMIN', 'LIDER', 'ALUMNA')
 */
function verificarRol(...roles) {
  return (req, res, next) => {
    if (!req.usuaria?.rol || !roles.includes(req.usuaria.rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: 'No tienes permisos para realizar esta acción.',
      })
    }
    next()
  }
}

/**
 * Igual que verificarSesion pero no bloquea si no hay token.
 * Úsalo en endpoints públicos que ofrecen información extra si hay sesión
 * (ej: ¿le dio like a esta noticia?).
 */
function verificarSesionOpcional(req, res, next) {
  const cabecera = req.headers['authorization']
  if (cabecera && cabecera.startsWith('Bearer ')) {
    const token = cabecera.split(' ')[1]
    try {
      req.usuaria = jwt.verify(token, CLAVE_SECRETA)
    } catch {
      // token inválido → ignorar, seguir sin usuario
    }
  }
  next()
}

module.exports = { verificarSesion, verificarSesionOpcional, generarToken, verificarRol }
