/*
 * ============================================================
 * components/layout/Navbar.jsx  —  Barra de navegación principal
 * ============================================================
 *
 * Muestra:
 *   - Logo MMT Valpo Hub
 *   - Enlaces de navegación (activo resaltado en morado)
 *   - Datos de la alumna autenticada (o botón de login)
 *   - Menú hamburguesa en móviles
 *
 * Usa useSesion() para saber si hay un usuario conectado.
 */

import { useState }       from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSesion }      from '../../context/SesionContext'
import logoMMT            from '../../masmujeresenlastics_logo.jpg'

const BADGES_ROL = {
  ADMIN: { label: 'Admin', clase: 'bg-mmt-purple text-white' },
  LIDER: { label: 'Líder', clase: 'bg-mmt-celeste text-white' },
}

// Definición de los enlaces de navegación
const ENLACES = [
  { a: '/',                   etiqueta: 'Dashboard',  auth: false,  rol: null    },
  { a: '/noticias',           etiqueta: 'Noticias',   auth: false,  rol: null    },
  { a: '/tareas',             etiqueta: 'Gestión',    auth: true,   rol: null    },
  { a: '/proyectos',          etiqueta: 'Proyectos',  auth: true,   rol: null    },
  { a: '/materiales',         etiqueta: 'Materiales', auth: false,  rol: null    },
  { a: '/perfil',             etiqueta: 'Mi Perfil',  auth: true,   rol: null    },
  { a: '/admin',              etiqueta: 'Admin',      auth: true,   rol: 'ADMIN' },
]

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { pathname }  = useLocation()
  const navegar       = useNavigate()

  // Datos de la alumna autenticada
  const { alumna, logout } = useSesion()

  // Iniciales para el avatar (usamos las primeras 2 palabras del nombre)
  const iniciales = alumna?.nombre
    ? alumna.nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?'

  function cerrarSesion() {
    logout()
    navegar('/')
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ---- Logo ---- */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logoMMT}
              alt="Más Mujeres en las TICs"
              className="w-9 h-9 rounded-full object-cover group-hover:scale-105 transition-transform duration-300 shadow-sm ring-2 ring-mmt-purple/20"
            />
            <div className="leading-tight">
              <p className="font-bold text-mmt-purple text-sm tracking-tight">MMT Valpo</p>
              <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Hub</p>
            </div>
          </Link>

          {/* ---- Links de navegación (escritorio) ---- */}
          <div className="hidden md:flex items-center gap-1">
            {ENLACES.filter(e => (!e.auth || alumna) && (!e.rol || alumna?.rol === e.rol)).map(({ a, etiqueta }) => {
              const activo = pathname === a
              return (
                <Link
                  key={a}
                  to={a}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${activo
                      ? 'bg-mmt-purple text-white shadow-sm'
                      : 'text-gray-600 hover:bg-mmt-purple-50 hover:text-mmt-purple'
                    }`}
                >
                  {etiqueta}
                </Link>
              )
            })}
          </div>

          {/* ---- Sección de usuaria (escritorio) ---- */}
          <div className="hidden md:flex items-center gap-3">
            {alumna ? (
              /* Alumna autenticada → mostramos su nombre con opción de logout */
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2.5 bg-gradient-to-r from-mmt-purple-50 to-mmt-celeste-50
                                border border-gray-100 rounded-full px-4 py-1.5">
                  {/* Avatar con iniciales */}
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-mmt-purple to-mmt-celeste
                                  flex items-center justify-center text-white text-xs font-bold">
                    {iniciales}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-medium text-gray-700">
                      {alumna.nombre.split(' ')[0]}
                    </span>
                    {BADGES_ROL[alumna.rol] && (
                      <span className={`text-[9px] font-bold px-1.5 py-px rounded-full self-start ${BADGES_ROL[alumna.rol].clase}`}>
                        {BADGES_ROL[alumna.rol].label}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={cerrarSesion}
                  title="Cerrar sesión"
                  className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors text-xs font-medium"
                >
                  Salir
                </button>
              </div>
            ) : (
              /* Sin sesión → botón de login */
              <Link to="/login" className="btn-primary py-2 px-4 text-sm">
                Iniciar sesión
              </Link>
            )}
          </div>

          {/* ---- Botón hamburguesa (móvil) ---- */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-mmt-purple-50 hover:text-mmt-purple transition-colors"
            aria-label="Abrir menú"
          >
            <div className="w-5 space-y-1.5">
              <span className={`block h-0.5 bg-current transition-all duration-200
                ${menuAbierto ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all duration-200
                ${menuAbierto ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all duration-200
                ${menuAbierto ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* ---- Menú móvil desplegable ---- */}
      {menuAbierto && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 pt-2 space-y-1">
          {ENLACES.filter(e => (!e.auth || alumna) && (!e.rol || alumna?.rol === e.rol)).map(({ a, etiqueta }) => {
            const activo = pathname === a
            return (
              <Link
                key={a}
                to={a}
                onClick={() => setMenuAbierto(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${activo ? 'bg-mmt-purple text-white' : 'text-gray-600 hover:bg-mmt-purple-50 hover:text-mmt-purple'}`}
              >
                {etiqueta}
              </Link>
            )
          })}

          {/* Pie del menú móvil → login o logout */}
          <div className="pt-2 border-t border-gray-100 mt-2">
            {alumna ? (
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">{alumna.nombre}</span>
                  {BADGES_ROL[alumna.rol] && (
                    <span className={`text-[9px] font-bold px-1.5 py-px rounded-full ${BADGES_ROL[alumna.rol].clase}`}>
                      {BADGES_ROL[alumna.rol].label}
                    </span>
                  )}
                </div>
                <button onClick={cerrarSesion} className="text-xs text-red-400 font-semibold">
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuAbierto(false)}
                className="block btn-primary text-center text-sm py-2"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
