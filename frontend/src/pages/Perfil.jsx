/*
 * ============================================================
 * pages/Perfil.jsx  —  Perfil de la alumna autenticada
 * ============================================================
 *
 * Muestra:
 *   - Datos de la alumna (nombre, carrera, cohorte)
 *   - Sus estadísticas en el programa
 *   - Lista de materiales que ha subido al repositorio
 */

import { useState, useEffect, useRef } from 'react'
import { Link }                        from 'react-router-dom'
import { useSesion }                   from '../context/SesionContext'
import { useApi, apiFetch }            from '../hooks/useApi'
import MaterialCard                    from '../components/materials/MaterialCard'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const CONFIG_ESTADO_PROYECTO = {
  PENDIENTE:   { label: 'Pendiente',   clase: 'bg-gray-100 text-gray-500'              },
  EN_REVISION: { label: 'En revisión', clase: 'bg-yellow-100 text-yellow-700'           },
  APROBADO:    { label: 'Aprobado',    clase: 'bg-green-100 text-green-700'             },
  FINALIZADO:  { label: 'Finalizado',  clase: 'bg-mmt-purple-100 text-mmt-purple-dark'  },
}

export default function Perfil() {
  const { alumna, actualizarAlumna } = useSesion()

  // Cargamos los materiales de esta alumna usando su ID
  const {
    datos:    materiales = [],
    cargando,
    error,
  } = useApi(
    alumna ? `/api/materiales?id_alumna=${alumna.id}&limite=50` : null,
    { deps: [alumna?.id] }
  )

  const [tareasCompletadas, setTareasCompletadas] = useState([])
  const [misProyectos,      setMisProyectos]      = useState([])

  const [editando,       setEditando]       = useState(false)
  const [form,           setForm]           = useState({ nombre: '', carrera: '' })
  const [guardando,      setGuardando]      = useState(false)
  const [errorEdit,      setErrorEdit]      = useState(null)
  const [subiendoAvatar, setSubiendoAvatar] = useState(false)
  const avatarInputRef = useRef(null)

  function abrirEdicion() {
    setForm({ nombre: alumna.nombre, carrera: alumna.carrera ?? '' })
    setErrorEdit(null)
    setEditando(true)
  }

  async function guardarPerfil(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setErrorEdit('El nombre no puede estar vacío.'); return }
    setGuardando(true)
    setErrorEdit(null)
    try {
      const json = await apiFetch('/api/auth/perfil', {
        method: 'PATCH',
        body:   JSON.stringify({ nombre: form.nombre.trim(), carrera: form.carrera.trim() || null }),
      })
      actualizarAlumna(json.alumna)
      setEditando(false)
    } catch (err) {
      setErrorEdit(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function subirAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendoAvatar(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const json = await apiFetch('/api/auth/avatar', { method: 'PATCH', body: fd })
      actualizarAlumna(json.alumna)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubiendoAvatar(false)
      e.target.value = ''
    }
  }

  useEffect(() => {
    if (!alumna) return
    apiFetch(`/api/tareas?estado=COMPLETADA&idAlumna=${alumna.id}`)
      .then(j => setTareasCompletadas(j.tareas ?? []))
      .catch(() => {})
    apiFetch('/api/proyectos')
      .then(j => setMisProyectos(j.proyectos ?? []))
      .catch(() => {})
  }, [alumna?.id])

  // Si no hay sesión, mostramos mensaje para iniciar sesión
  if (!alumna) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-mmt-purple-50 to-mmt-celeste-50
                        border-2 border-dashed border-mmt-purple/20" />
        <h2 className="text-xl font-bold text-gray-800">Acceso a tu perfil</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Inicia sesión para ver tu perfil y los materiales que has subido al repositorio.
        </p>
        <Link to="/login" className="btn-primary text-sm">
          Iniciar sesión
        </Link>
      </div>
    )
  }

  // Generamos las iniciales del nombre para el avatar
  const iniciales = alumna.nombre
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* Tarjeta de perfil */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-mmt-purple to-mmt-celeste-dark p-8 text-white">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar con imagen o iniciales + botón de cambio */}
          <div className="relative flex-shrink-0 group">
            {alumna.avatar_url ? (
              <img
                src={`${API_BASE}${alumna.avatar_url}`}
                alt={alumna.nombre}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-white/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border-2 border-white/30
                              flex items-center justify-center text-3xl font-bold text-white">
                {iniciales}
              </div>
            )}
            {/* Overlay de cambio de avatar */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={subiendoAvatar}
              title="Cambiar foto de perfil"
              className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100
                         transition-opacity flex items-center justify-center disabled:cursor-wait"
            >
              {subiendoAvatar ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={subirAvatar}
            />
          </div>

          {/* Datos de la alumna */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold mb-1">{alumna.nombre}</h1>
            <p className="text-white/80 text-sm mb-1">{alumna.carrera || 'Sin carrera registrada'}</p>
            <p className="text-white/60 text-xs">{alumna.email}</p>

            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Cohorte {alumna.anio_cohorte || 2026}
              </span>
              {alumna.nombre_sede ? (
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {alumna.nombre_sede}
                </span>
              ) : (
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Programa MMT Valparaíso
                </span>
              )}
              {alumna.rol === 'ADMIN' && (
                <span className="bg-white text-mmt-purple text-xs font-bold px-3 py-1 rounded-full">
                  Administradora
                </span>
              )}
              {alumna.rol === 'LIDER' && (
                <span className="bg-white text-mmt-celeste-dark text-xs font-bold px-3 py-1 rounded-full">
                  Líder de Ruta
                </span>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="sm:ml-auto self-start flex-shrink-0">
            <button
              onClick={editando ? () => setEditando(false) : abrirEdicion}
              className="bg-white/10 hover:bg-white/20 border border-white/20
                         text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {editando ? 'Cancelar' : 'Editar perfil'}
            </button>
          </div>
        </div>
      </div>

      {/* Formulario de edición inline */}
      {editando && (
        <form onSubmit={guardarPerfil} className="card p-6 space-y-4 border-2 border-mmt-purple/20">
          <h2 className="font-bold text-gray-700 text-sm">Editar información personal</h2>

          {errorEdit && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorEdit}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Nombre completo <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="input-field w-full py-2 text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Carrera <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.carrera}
                onChange={e => setForm(f => ({ ...f, carrera: e.target.value }))}
                placeholder="Ej: Ing. en Computación e Informática"
                className="input-field w-full py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="btn-outline text-sm py-2 px-4"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}

      {/* Mis estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center py-5">
          <p className="text-3xl font-extrabold text-mmt-purple mb-1">{materiales.length}</p>
          <p className="text-xs text-gray-500">Materiales subidos</p>
        </div>
        <div className="card text-center py-5">
          <p className="text-3xl font-extrabold text-mmt-celeste-dark mb-1">
            {materiales.reduce((sum, m) => sum + (m.descargas || 0), 0)}
          </p>
          <p className="text-xs text-gray-500">Descargas totales</p>
        </div>
        <div className="card text-center py-5">
          <p className="text-3xl font-extrabold text-mmt-purple mb-1">2026</p>
          <p className="text-xs text-gray-500">Cohorte activa</p>
        </div>
      </div>

      {/* Mis materiales */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-mmt-purple to-mmt-celeste" />
          <h2 className="text-lg font-bold text-gray-800">Mis materiales subidos</h2>
        </div>

        {cargando && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mmt-purple/30 border-t-mmt-purple rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 text-center py-8">{error}</p>
        )}

        {!cargando && !error && (
          materiales.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {materiales.map(m => (
                <MaterialCard key={m.id} material={m} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">

              <p className="font-semibold text-gray-600">Aún no has subido materiales</p>
              <p className="text-sm mt-1">Comparte tu trabajo con tus compañeras.</p>
              <Link to="/materiales" className="btn-primary mt-4 inline-block text-sm">
                Subir mi primer material
              </Link>
            </div>
          )
        )}
      </section>

      {/* ---- Tareas completadas ---- */}
      {tareasCompletadas.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-mmt-purple to-mmt-celeste" />
            <h2 className="text-lg font-bold text-gray-800">Tareas completadas</h2>
            <span className="ml-auto text-xs font-bold text-mmt-purple bg-mmt-purple-100 px-2.5 py-0.5 rounded-full">
              {tareasCompletadas.length}
            </span>
          </div>
          <div className="space-y-3">
            {tareasCompletadas.map(t => (
              <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-mmt-purple">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-sm text-gray-800">{t.titulo}</p>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-mmt-purple-100 text-mmt-purple">
                    {t.ruta ? { LIDERAZGO: 'Liderazgo', VOCACION: 'Vocación', PROYECTOS: 'Proyectos' }[t.ruta] ?? t.ruta : ''}
                  </span>
                </div>
                {t.lecciones && (
                  <p className="text-xs text-gray-500 italic leading-relaxed line-clamp-2">
                    "{t.lecciones}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Mis proyectos ---- */}
      {misProyectos.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-mmt-celeste to-mmt-purple" />
            <h2 className="text-lg font-bold text-gray-800">Mis proyectos</h2>
            <span className="ml-auto text-xs font-bold text-mmt-celeste-dark bg-mmt-celeste-50 px-2.5 py-0.5 rounded-full">
              {misProyectos.length}
            </span>
          </div>
          <div className="space-y-3">
            {misProyectos.map(p => {
              const cfg = CONFIG_ESTADO_PROYECTO[p.estado] ?? { label: p.estado, clase: 'bg-gray-100 text-gray-500' }
              return (
                <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{p.nombre}</p>
                    {p.descripcion && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.descripcion}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.clase}`}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

    </div>
  )
}
