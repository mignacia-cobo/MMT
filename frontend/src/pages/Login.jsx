/*
 * ============================================================
 * pages/Login.jsx  —  Página de inicio de sesión / registro
 * ============================================================
 *
 * Formulario de doble función:
 *   - Modo "login":    alumna ingresa con email + contraseña
 *   - Modo "registro": alumna crea su cuenta por primera vez
 *
 * Usa el SesionContext para guardar el token y redirigir.
 */

import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { apiFetch }            from '../hooks/useApi'
import { useSesion }           from '../context/SesionContext'
import logoMMT                 from '../masmujeresenlastics_logo.jpg'

export default function Login() {
  const [modo, setModo] = useState('login') // 'login' | 'registro'

  const [form, setForm] = useState({
    nombre:   '',
    email:    '',
    password: '',
    carrera:  '',
    idSede:   '',
  })

  const [sedes,    setSedes]    = useState([])
  const [cargando, setCargando] = useState(false)
  const [error,    setError]    = useState(null)

  // Cargamos sedes activas cuando la alumna elige registrarse
  useEffect(() => {
    if (modo === 'registro' && sedes.length === 0) {
      apiFetch('/api/sedes')
        .then(j => setSedes(j.sedes ?? []))
        .catch(() => {})
    }
  }, [modo])

  const { login }  = useSesion()
  const navegar    = useNavigate()

  function actualizarCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  async function alEnviar(e) {
    e.preventDefault()
    setCargando(true)
    setError(null)

    try {
      // Llamamos al endpoint correspondiente según el modo
      const ruta = modo === 'login' ? '/api/auth/login' : '/api/auth/registrar'
      const respuesta = await apiFetch(ruta, {
        method: 'POST',
        body:   JSON.stringify(form),
      })

      // Guardamos token y datos de la alumna en el contexto
      login(respuesta.token, respuesta.alumna)

      // Redirigimos al dashboard
      navegar('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mmt-purple-50 via-white to-mmt-celeste-50
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / encabezado */}
        <div className="text-center mb-8">
          <img
            src={logoMMT}
            alt="Más Mujeres en las TICs"
            className="w-20 h-20 rounded-3xl object-cover shadow-lg mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-800">MMT Valpo Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Programa MMT — Duoc UC Valparaíso</p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="card">

          {/* Selector login/registro */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setModo('login'); setError(null) }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all
                ${modo === 'login' ? 'bg-white shadow-sm text-mmt-purple' : 'text-gray-500'}`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setModo('registro'); setError(null) }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all
                ${modo === 'registro' ? 'bg-white shadow-sm text-mmt-purple' : 'text-gray-500'}`}
            >
              Registrarse
            </button>
          </div>

          {/* Mensaje de error */}
          {error && (
            <p className="mb-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <form onSubmit={alEnviar} className="space-y-4">

            {/* Campo nombre — solo en registro */}
            {modo === 'registro' && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Nombre completo <span className="text-mmt-purple">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={e => actualizarCampo('nombre', e.target.value)}
                  placeholder="Ej: Valentina Rojas"
                  className="input-field"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Email <span className="text-mmt-purple">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => actualizarCampo('email', e.target.value)}
                placeholder="tu.nombre@mmt.cl"
                className="input-field"
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Contraseña <span className="text-mmt-purple">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={e => actualizarCampo('password', e.target.value)}
                placeholder={modo === 'registro' ? 'Mínimo 6 caracteres' : '••••••••'}
                className="input-field"
              />
            </div>

            {/* Campo carrera — solo en registro */}
            {modo === 'registro' && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Carrera <span className="text-gray-400 font-normal text-xs">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.carrera}
                  onChange={e => actualizarCampo('carrera', e.target.value)}
                  placeholder="Ej: Ing. en Computación e Informática"
                  className="input-field"
                />
              </div>
            )}

            {/* Campo sede — solo en registro */}
            {modo === 'registro' && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Sede <span className="text-mmt-purple">*</span>
                </label>
                <select
                  required
                  value={form.idSede}
                  onChange={e => actualizarCampo('idSede', e.target.value)}
                  className="input-field"
                >
                  <option value="">Selecciona tu sede...</option>
                  {sedes.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Botón enviar */}
            <button
              type="submit"
              disabled={cargando}
              className="btn-primary w-full flex items-center justify-center gap-2
                         disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {cargando ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando...</>
              ) : modo === 'login' ? (
                'Entrar al Hub'
              ) : (
                'Crear mi cuenta'
              )}
            </button>
          </form>

          {/* Credenciales de prueba para desarrollo */}
          {modo === 'login' && (
            <div className="mt-5 p-3 bg-mmt-purple-50 rounded-xl border border-mmt-purple-100">
              <p className="text-xs font-semibold text-mmt-purple mb-1">Cuenta de prueba (desarrollo):</p>
              <p className="text-xs text-gray-600 font-mono">v.rojas@mmt.cl / test1234</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
