/*
 * ============================================================
 * pages/Proyectos.jsx  —  Monitor de proyectos MMT
 * ============================================================
 *
 * RBAC:
 *   ADMIN → ve todos, filtra por ruta/estado, cambia estado, asigna líder
 *   LIDER → ve solo proyectos de su ruta_asignada
 *   ALUMNA → ve los suyos (cualquier estado) + APROBADO/FINALIZADO
 *
 * API:
 *   GET    /api/proyectos              → listar (filtro por rol en backend)
 *   POST   /api/proyectos              → postular
 *   PATCH  /api/proyectos/:id/estado   → cambiar estado (ADMIN)
 *   PATCH  /api/proyectos/:id/lider    → asignar líder  (ADMIN)
 */

import { useState, useEffect, useCallback } from 'react'
import { Link }           from 'react-router-dom'
import { apiFetch }       from '../hooks/useApi'
import { useSesion }      from '../context/SesionContext'
import ProyectoModal      from '../components/proyectos/ProyectoModal'

// -------------------------------------------------------
// CONSTANTES DE VISUALIZACIÓN
// -------------------------------------------------------

const CONFIG_ESTADO = {
  PENDIENTE:   { label: 'Pendiente',   clase: 'bg-gray-100 text-gray-600',               siguiente: ['EN_REVISION'] },
  EN_REVISION: { label: 'En revisión', clase: 'bg-yellow-100 text-yellow-700',            siguiente: ['APROBADO', 'PENDIENTE'] },
  APROBADO:    { label: 'Aprobado',    clase: 'bg-green-100 text-green-700',              siguiente: ['FINALIZADO', 'EN_REVISION'] },
  FINALIZADO:  { label: 'Finalizado',  clase: 'bg-mmt-purple-100 text-mmt-purple-dark',  siguiente: [] },
}

const CONFIG_RUTA = {
  LIDERAZGO: { label: 'Liderazgo', clase: 'bg-mmt-purple-100 text-mmt-purple',       borde: 'border-mmt-purple'  },
  VOCACION:  { label: 'Vocación',  clase: 'bg-mmt-celeste-100 text-mmt-celeste-dark', borde: 'border-mmt-celeste' },
  PROYECTOS: { label: 'Proyectos', clase: 'bg-gray-100 text-gray-600',               borde: 'border-gray-300'    },
}

const LABEL_ESTADOS = { PENDIENTE: 'Pendiente', EN_REVISION: 'En revisión', APROBADO: 'Aprobado', FINALIZADO: 'Finalizado' }
const LABEL_RUTAS   = { LIDERAZGO: 'Liderazgo', VOCACION: 'Vocación', PROYECTOS: 'Proyectos' }

const FORM_VACIO = { nombre: '', descripcion: '', ruta: 'PROYECTOS' }

// -------------------------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------------------------

export default function Proyectos() {
  const { alumna } = useSesion()

  const [proyectos,     setProyectos]     = useState([])
  const [cargando,      setCargando]      = useState(true)
  const [error,         setError]         = useState(null)
  const [filtroRuta,    setFiltroRuta]    = useState(null)
  const [filtroEstado,  setFiltroEstado]  = useState(null)
  const [mostrarForm,   setMostrarForm]   = useState(false)
  const [form,          setForm]          = useState(FORM_VACIO)
  const [postulando,    setPostulando]    = useState(false)
  const [errorForm,     setErrorForm]     = useState(null)
  const [aviso,             setAviso]             = useState(null)
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null)

  const esAdmin = alumna?.rol === 'ADMIN'
  const esLider = alumna?.rol === 'LIDER'

  const cargarProyectos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filtroRuta   && esAdmin) params.set('ruta',   filtroRuta)
      if (filtroEstado)             params.set('estado', filtroEstado)
      const query = params.toString()
      const json  = await apiFetch(`/api/proyectos${query ? '?' + query : ''}`)
      setProyectos(json.proyectos)
      setAviso(json.aviso ?? null)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [filtroRuta, filtroEstado, esAdmin])

  useEffect(() => { cargarProyectos() }, [cargarProyectos])

  async function cambiarEstado(id, estado) {
    try {
      await apiFetch(`/api/proyectos/${id}/estado`, {
        method: 'PATCH',
        body:   JSON.stringify({ estado }),
      })
      await cargarProyectos()
    } catch (err) {
      alert(err.message)
    }
  }

  async function postularProyecto(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setErrorForm('El nombre es obligatorio.'); return }
    setPostulando(true)
    setErrorForm(null)
    try {
      await apiFetch('/api/proyectos', {
        method: 'POST',
        body:   JSON.stringify({
          nombre:      form.nombre.trim(),
          descripcion: form.descripcion.trim() || undefined,
          ruta:        form.ruta,
        }),
      })
      setForm(FORM_VACIO)
      setMostrarForm(false)
      await cargarProyectos()
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setPostulando(false)
    }
  }

  if (!alumna) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <p className="text-gray-500 text-sm">Inicia sesión para ver los proyectos.</p>
        <Link to="/login" className="btn-primary text-sm">Iniciar sesión</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ---- Encabezado ---- */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Proyectos MMT</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {esAdmin  && 'Vista de administradora — todos los proyectos por ruta'}
            {esLider  && `Vista de líder — proyectos de tu ruta: ${alumna.ruta_asignada ? LABEL_RUTAS[alumna.ruta_asignada] : 'sin asignar'}`}
            {!esAdmin && !esLider && 'Tus postulaciones y proyectos aprobados del programa'}
          </p>
        </div>
        <button
          onClick={() => { setMostrarForm(v => !v); setErrorForm(null) }}
          className={mostrarForm ? 'btn-outline py-2 px-4 text-sm' : 'btn-primary py-2 px-4 text-sm'}
        >
          {mostrarForm ? 'Cancelar' : '+ Postular proyecto'}
        </button>
      </div>

      {/* ---- Aviso LIDER sin ruta ---- */}
      {aviso && (
        <div className="card p-4 border-yellow-200 bg-yellow-50 text-yellow-700 text-sm">
          {aviso} Contacta a la administradora para que te asigne una ruta.
        </div>
      )}

      {/* ---- Formulario de postulación ---- */}
      {mostrarForm && (
        <form onSubmit={postularProyecto} className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-700 text-sm">Postular nuevo proyecto</h2>

          {errorForm && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorForm}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Nombre del proyecto <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: App de orientación vocacional STEM"
                className="input-field w-full py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Ruta MMT</label>
              <select
                value={form.ruta}
                onChange={e => setForm(f => ({ ...f, ruta: e.target.value }))}
                className="input-field w-full py-2 text-sm"
              >
                <option value="LIDERAZGO">Liderazgo</option>
                <option value="VOCACION">Vocación</option>
                <option value="PROYECTOS">Proyectos</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="¿Qué problema resuelve tu proyecto? ¿A quién va dirigido?"
                rows={3}
                className="input-field w-full py-2 text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={postulando}
              className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
            >
              {postulando ? 'Postulando...' : 'Enviar postulación'}
            </button>
          </div>
        </form>
      )}

      {/* ---- Filtros ---- */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Filtro de ruta (solo ADMIN) */}
        {esAdmin && (
          <div className="flex flex-wrap gap-1.5">
            {[null, 'LIDERAZGO', 'VOCACION', 'PROYECTOS'].map(r => (
              <button
                key={r ?? 'todas'}
                onClick={() => setFiltroRuta(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                  ${filtroRuta === r
                    ? 'bg-mmt-purple text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-mmt-purple hover:text-mmt-purple'
                  }`}
              >
                {r ? LABEL_RUTAS[r] : 'Todas las rutas'}
              </button>
            ))}
          </div>
        )}

        {/* Separador */}
        {esAdmin && <span className="text-gray-200 text-lg">|</span>}

        {/* Filtro de estado (todos los roles) */}
        <div className="flex flex-wrap gap-1.5">
          {[null, ...Object.keys(CONFIG_ESTADO)].map(e => (
            <button
              key={e ?? 'todos'}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                ${filtroEstado === e
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                }`}
            >
              {e ? LABEL_ESTADOS[e] : 'Todos los estados'}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Contenido ---- */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-mmt-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="font-semibold text-red-600">Error al cargar proyectos</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button onClick={cargarProyectos} className="btn-primary mt-4 text-sm">Reintentar</button>
        </div>
      ) : proyectos.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <p className="text-sm">
            {filtroRuta || filtroEstado
              ? 'No hay proyectos con estos filtros.'
              : 'No hay proyectos registrados aún.'}
          </p>
          <button
            onClick={() => setMostrarForm(true)}
            className="btn-primary mt-4 text-sm"
          >
            + Postular el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {proyectos.map(p => (
            <ProyectoCard
              key={p.id}
              proyecto={p}
              esAdmin={esAdmin}
              alCambiarEstado={cambiarEstado}
              alAbrir={setProyectoSeleccionado}
            />
          ))}
        </div>
      )}

      {/* Modal de detalle ---- */}
      {proyectoSeleccionado && (
        <ProyectoModal
          proyecto={proyectoSeleccionado}
          esAdmin={esAdmin}
          esLider={esLider}
          alumnaId={alumna?.id}
          onCerrar={() => setProyectoSeleccionado(null)}
          alCambiarEstado={(id, estado) => {
            cambiarEstado(id, estado)
            setProyectoSeleccionado(null)
          }}
          onActualizar={cargarProyectos}
        />
      )}

    </div>
  )
}

// -------------------------------------------------------
// TARJETA DE PROYECTO
// -------------------------------------------------------

function ProyectoCard({ proyecto, esAdmin, alCambiarEstado, alAbrir }) {
  const ruta   = CONFIG_RUTA[proyecto.ruta]   ?? { label: proyecto.ruta,   clase: 'bg-gray-100 text-gray-600',  borde: 'border-gray-300' }
  const estado = CONFIG_ESTADO[proyecto.estado] ?? { label: proyecto.estado, clase: 'bg-gray-100 text-gray-600', siguiente: [] }

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-t-4 ${ruta.borde} p-5 space-y-3 hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => alAbrir(proyecto)}
    >

      {/* Badges de ruta + estado */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${ruta.clase}`}>
          {ruta.label}
        </span>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${estado.clase}`}>
          {estado.label}
        </span>
      </div>

      {/* Nombre */}
      <h3 className="font-bold text-gray-800 text-sm leading-snug">{proyecto.nombre}</h3>

      {/* Descripción */}
      {proyecto.descripcion && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{proyecto.descripcion}</p>
      )}

      {/* Metadata */}
      <div className="space-y-1 text-xs text-gray-500 pt-1 border-t border-gray-50">
        <p>
          <span className="font-semibold text-gray-400">Postulante: </span>
          {proyecto.nombre_postulante ?? '—'}
        </p>
        {proyecto.asignadas?.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-0.5">
            <span className="font-semibold text-gray-400 text-xs self-center">Equipo: </span>
            {proyecto.asignadas.map(a => (
              <span key={a.id} className="inline-flex items-center px-2 py-0.5 rounded-full bg-mmt-purple-100 text-mmt-purple text-[9px] font-semibold">
                {a.nombre}
              </span>
            ))}
          </div>
        ) : (
          <p>
            <span className="font-semibold text-gray-400">Equipo: </span>
            <span className="italic text-gray-300">Sin asignar</span>
          </p>
        )}
      </div>

      {/* Hint de click */}
      <p className="text-[10px] text-gray-300 font-medium">Ver detalle y tareas →</p>

      {/* Acciones ADMIN — stopPropagation para no abrir el modal */}
      {esAdmin && estado.siguiente.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1" onClick={e => e.stopPropagation()}>
          {estado.siguiente.map(sig => (
            <button
              key={sig}
              onClick={() => alCambiarEstado(proyecto.id, sig)}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg
                         bg-gray-100 text-gray-600 hover:bg-mmt-purple hover:text-white transition-colors"
            >
              → {LABEL_ESTADOS[sig]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
