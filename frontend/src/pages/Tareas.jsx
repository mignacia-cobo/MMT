/*
 * ============================================================
 * pages/Tareas.jsx  —  Tablero Kanban de Gestión MMT
 * ============================================================
 *
 * Las alumnas tienen 3 rutas de desarrollo:
 *   Liderazgo · Vocación · Proyectos
 *
 * Cada ruta tiene tareas en 3 estados:
 *   Pendiente · En progreso · Completada
 *
 * API:
 *   GET    /api/tareas                → listar
 *   POST   /api/tareas                → crear (ADMIN, LIDER)
 *   PATCH  /api/tareas/:id/estado     → cambiar estado
 *   GET    /api/tareas/:id/comentarios → hilo (desde TareaModal)
 *   POST   /api/tareas/:id/comentarios → comentar (desde TareaModal)
 */

import { useState, useEffect, useCallback } from 'react'
import { apiFetch }   from '../hooks/useApi'
import { useSesion }  from '../context/SesionContext'
import TareaModal     from '../components/tareas/TareaModal'

// -------------------------------------------------------
// CONSTANTES
// -------------------------------------------------------

const RUTAS_DISPLAY = ['Liderazgo', 'Vocación', 'Proyectos']

const ESTADOS = {
  pendiente:   { label: 'Pendiente',   color: 'bg-gray-100 text-gray-600',                punto: 'bg-gray-300'                  },
  en_progreso: { label: 'En progreso', color: 'bg-mmt-celeste-100 text-mmt-celeste-dark',  punto: 'bg-mmt-celeste animate-pulse' },
  completada:  { label: 'Completada',  color: 'bg-mmt-purple-100 text-mmt-purple-dark',    punto: 'bg-mmt-purple'                },
}

const COLORES_RUTA = {
  Liderazgo: { borde: 'border-mmt-purple',  titulo: 'text-mmt-purple',      fondo: 'bg-mmt-purple-50'  },
  Vocación:  { borde: 'border-mmt-celeste', titulo: 'text-mmt-celeste-dark', fondo: 'bg-mmt-celeste-50' },
  Proyectos: { borde: 'border-gray-300',    titulo: 'text-gray-700',         fondo: 'bg-gray-50'        },
}

const PRIORIDADES = {
  alta:  { label: 'Alta',  clase: 'bg-red-100 text-red-600'       },
  media: { label: 'Media', clase: 'bg-yellow-100 text-yellow-700' },
  baja:  { label: 'Baja',  clase: 'bg-green-100 text-green-600'   },
}

const MAPA_RUTA = { LIDERAZGO: 'Liderazgo', VOCACION: 'Vocación', PROYECTOS: 'Proyectos' }

const FORM_VACIO = { titulo: '', descripcion: '', prioridad: 'MEDIA', ruta: 'LIDERAZGO', idProyecto: '', idsAsignadas: [], idHito: '', fechaLimite: '' }

function normalizarTarea(t) {
  return {
    ...t,
    estado:    t.estado.toLowerCase(),
    prioridad: t.prioridad.toLowerCase(),
    ruta:      MAPA_RUTA[t.ruta] ?? t.ruta,
  }
}

// -------------------------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------------------------

export default function Tareas() {
  const { alumna } = useSesion()

  const [tareas,            setTareas]            = useState([])
  const [alumnas,           setAlumnas]           = useState([])
  const [cargando,          setCargando]          = useState(true)
  const [error,             setError]             = useState(null)
  const [rutaFiltro,        setRutaFiltro]        = useState('Todas')
  const [completando,       setCompletando]       = useState(null)   // { id, lecciones }
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null)   // abre el modal
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [form,              setForm]              = useState(FORM_VACIO)
  const [creando,           setCreando]           = useState(false)
  const [errorForm,         setErrorForm]         = useState(null)
  const [proyectos,         setProyectos]         = useState([])
  const [hitos,             setHitos]             = useState([])

  const puedeCrear = alumna?.rol === 'ADMIN' || alumna?.rol === 'LIDER'

  const cargarTareas = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const json = await apiFetch('/api/tareas')
      setTareas(json.tareas.map(normalizarTarea))
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarTareas() }, [cargarTareas])

  // Carga proyectos, hitos y alumnas cuando ADMIN/LIDER abre el formulario
  useEffect(() => {
    if (!mostrarFormulario || !puedeCrear) return
    apiFetch('/api/proyectos')
      .then(json => setProyectos(json.proyectos ?? []))
      .catch(() => setProyectos([]))
    apiFetch('/api/tareas/alumnas')
      .then(json => setAlumnas(json.alumnas ?? []))
      .catch(() => setAlumnas([]))
    apiFetch('/api/hitos')
      .then(json => setHitos(json.hitos ?? []))
      .catch(() => setHitos([]))
  }, [mostrarFormulario, puedeCrear])

  // --- Cambio de estado ---
  async function cambiarEstado(id, nuevoEstado) {
    if (nuevoEstado === 'completada') {
      setCompletando({ id, lecciones: '' })
      return
    }
    try {
      await apiFetch(`/api/tareas/${id}/estado`, {
        method: 'PATCH',
        body:   JSON.stringify({ estado: nuevoEstado.toUpperCase() }),
      })
      await cargarTareas()
    } catch (err) {
      alert(err.message)
    }
  }

  async function confirmarCompletada() {
    if (!completando.lecciones.trim()) return
    try {
      await apiFetch(`/api/tareas/${completando.id}/estado`, {
        method: 'PATCH',
        body:   JSON.stringify({ estado: 'COMPLETADA', lecciones: completando.lecciones.trim() }),
      })
      setCompletando(null)
      await cargarTareas()
    } catch (err) {
      alert(err.message)
    }
  }

  // --- Crear tarea ---
  async function crearTarea(e) {
    e.preventDefault()
    if (!form.titulo.trim()) { setErrorForm('El título es obligatorio.'); return }
    setCreando(true)
    setErrorForm(null)
    try {
      await apiFetch('/api/tareas', {
        method: 'POST',
        body:   JSON.stringify({
          titulo:        form.titulo.trim(),
          descripcion:   form.descripcion.trim() || undefined,
          prioridad:     form.prioridad,
          ruta:          form.ruta,
          idProyecto:    form.idProyecto ? Number(form.idProyecto) : undefined,
          idHito:        form.idHito     ? Number(form.idHito)     : undefined,
          fechaLimite:   form.fechaLimite || undefined,
          idsAsignadas:  form.idsAsignadas.map(Number),
        }),
      })
      setForm(FORM_VACIO)
      setMostrarFormulario(false)
      await cargarTareas()
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setCreando(false)
    }
  }

  // --- Filtros y contadores ---
  const tareasFiltradas = tareas.filter(
    t => rutaFiltro === 'Todas' || t.ruta === rutaFiltro
  )
  const contadores = {
    pendiente:   tareasFiltradas.filter(t => t.estado === 'pendiente').length,
    en_progreso: tareasFiltradas.filter(t => t.estado === 'en_progreso').length,
    completada:  tareasFiltradas.filter(t => t.estado === 'completada').length,
  }

  // --- Estados de carga / error ---
  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-mmt-purple border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="card p-8 text-center">
      <p className="font-semibold text-red-600">Error al cargar las tareas</p>
      <p className="text-sm text-gray-500 mt-1">{error}</p>
      <button onClick={cargarTareas} className="btn-primary mt-4 text-sm">Reintentar</button>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ---- Encabezado ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Tareas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tablero MMT 2026 — Visualiza y actualiza el avance de las 3 rutas
          </p>
        </div>
        {puedeCrear && (
          <button
            onClick={() => { setMostrarFormulario(v => !v); setErrorForm(null) }}
            className={mostrarFormulario
              ? 'btn-outline py-2 px-4 text-sm'
              : 'btn-primary py-2 px-4 text-sm'}
          >
            {mostrarFormulario ? 'Cancelar' : '+ Nueva tarea'}
          </button>
        )}
      </div>

      {/* ---- Formulario de nueva tarea (ADMIN / LIDER) ---- */}
      {mostrarFormulario && puedeCrear && (
        <form onSubmit={crearTarea} className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-700 text-sm">Nueva tarea</h2>

          {errorForm && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorForm}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Título <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ej: Taller de comunicación efectiva"
                className="input-field w-full py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Ruta</label>
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

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Prioridad</label>
              <select
                value={form.prioridad}
                onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))}
                className="input-field w-full py-2 text-sm"
              >
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Detalle de la tarea (opcional)"
                rows={2}
                className="input-field w-full py-2 text-sm resize-none"
              />
            </div>

            {proyectos.length > 0 && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Asociar a proyecto</label>
                <select
                  value={form.idProyecto}
                  onChange={e => setForm(f => ({ ...f, idProyecto: e.target.value }))}
                  className="input-field w-full py-2 text-sm"
                >
                  <option value="">Sin proyecto</option>
                  {proyectos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Hito del cronograma</label>
              <select
                value={form.idHito}
                onChange={e => setForm(f => ({ ...f, idHito: e.target.value }))}
                className="input-field w-full py-2 text-sm"
              >
                <option value="">Sin hito</option>
                {hitos.map(h => (
                  <option key={h.id} value={h.id}>{h.titulo} — {h.fecha?.substring(0, 10)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha límite</label>
              <input
                type="date"
                value={form.fechaLimite}
                onChange={e => setForm(f => ({ ...f, fechaLimite: e.target.value }))}
                className="input-field w-full py-2 text-sm"
              />
            </div>

            {alumnas.length > 0 && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Asignar a</label>
                <SelectorAsignadas
                  alumnas={alumnas}
                  seleccionadas={form.idsAsignadas}
                  onChange={ids => setForm(f => ({ ...f, idsAsignadas: ids }))}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creando}
              className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
            >
              {creando ? 'Creando...' : 'Crear tarea'}
            </button>
          </div>
        </form>
      )}

      {/* ---- Filtro de rutas ---- */}
      <div className="flex flex-wrap gap-2">
        {['Todas', ...RUTAS_DISPLAY].map(ruta => (
          <button
            key={ruta}
            onClick={() => setRutaFiltro(ruta)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
              ${rutaFiltro === ruta
                ? 'bg-mmt-purple text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-mmt-purple hover:text-mmt-purple'
              }`}
          >
            {ruta}
          </button>
        ))}
      </div>

      {/* ---- Contadores ---- */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(ESTADOS).map(([clave, config]) => (
          <div key={clave} className="card p-4 text-center">
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${config.color} mb-2`}>
              <span className={`w-2 h-2 rounded-full ${config.punto}`} />
              {config.label}
            </div>
            <p className="text-3xl font-extrabold text-gray-800">{contadores[clave]}</p>
          </div>
        ))}
      </div>

      {/* ---- Tablero Kanban ---- */}
      {tareas.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <p className="text-sm">No hay tareas registradas aún.</p>
          {puedeCrear && (
            <button
              onClick={() => setMostrarFormulario(true)}
              className="btn-primary mt-4 text-sm"
            >
              + Crear la primera tarea
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Object.entries(ESTADOS).map(([clave, config]) => (
            <Columna
              key={clave}
              estado={clave}
              config={config}
              tareas={tareasFiltradas.filter(t => t.estado === clave)}
              alCambiarEstado={cambiarEstado}
              alAbrir={setTareaSeleccionada}
              completando={completando}
              alActualizarLecciones={lecciones => setCompletando(prev => ({ ...prev, lecciones }))}
              alConfirmarCompletada={confirmarCompletada}
              alCancelarCompletada={() => setCompletando(null)}
            />
          ))}
        </div>
      )}

      {/* ---- Modal de detalle ---- */}
      {tareaSeleccionada && (
        <TareaModal
          tarea={tareaSeleccionada}
          onCerrar={() => setTareaSeleccionada(null)}
          onActualizar={async () => { await cargarTareas(); setTareaSeleccionada(null) }}
        />
      )}

    </div>
  )
}

// -------------------------------------------------------
// SUBCOMPONENTES
// -------------------------------------------------------

function Columna({ estado, config, tareas, alCambiarEstado, alAbrir, completando,
                   alActualizarLecciones, alConfirmarCompletada, alCancelarCompletada }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 min-h-[300px]">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-3 h-3 rounded-full ${config.punto}`} />
        <h3 className="font-bold text-gray-700 text-sm">{config.label}</h3>
        <span className="ml-auto bg-white border border-gray-200 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">
          {tareas.length}
        </span>
      </div>

      <div className="space-y-3">
        {tareas.map(tarea => (
          <TareaCard
            key={tarea.id}
            tarea={tarea}
            estadoActual={estado}
            alCambiarEstado={alCambiarEstado}
            alAbrir={alAbrir}
            estaCompletando={completando?.id === tarea.id}
            lecciones={completando?.id === tarea.id ? completando.lecciones : ''}
            alActualizarLecciones={alActualizarLecciones}
            alConfirmarCompletada={alConfirmarCompletada}
            alCancelarCompletada={alCancelarCompletada}
          />
        ))}
        {tareas.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">Sin tareas aquí</p>
        )}
      </div>
    </div>
  )
}

function TareaCard({ tarea, estadoActual, alCambiarEstado, alAbrir, estaCompletando,
                     lecciones, alActualizarLecciones, alConfirmarCompletada, alCancelarCompletada }) {
  const coloresRuta = COLORES_RUTA[tarea.ruta]
  const prioridad   = PRIORIDADES[tarea.prioridad]

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-l-4 ${coloresRuta.borde}
                  hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => alAbrir(tarea)}
    >
      {/* Área clickeable — abre el modal */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${coloresRuta.titulo}`}>
            {tarea.ruta}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${prioridad.clase}`}>
            {prioridad.label}
          </span>
        </div>

        <p className="font-semibold text-gray-800 text-sm mb-1 leading-snug">{tarea.titulo}</p>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{tarea.descripcion}</p>

        {tarea.asignadas?.length > 0 ? (
          <p className="text-[10px] text-gray-400 mt-1.5">
            → {tarea.asignadas.map(a => a.nombre).join(', ')}
          </p>
        ) : null}
        {tarea.nombre_proyecto && (
          <p className="text-[10px] text-mmt-purple font-semibold mt-1">[ {tarea.nombre_proyecto} ]</p>
        )}
        {(tarea.fecha_limite || tarea.fecha_hito) && (
          <p className="text-[10px] text-mmt-celeste-dark font-semibold mt-1">
            📅 {tarea.fecha_limite
              ? tarea.fecha_limite.substring(0, 10)
              : tarea.fecha_hito?.substring(0, 10)}
            {tarea.titulo_hito && !tarea.fecha_limite && (
              <span className="text-gray-400 font-normal ml-1">({tarea.titulo_hito})</span>
            )}
          </p>
        )}
      </div>

      {/* Botones de cambio de estado — stopPropagation para no abrir el modal */}
      <div className="px-4 pb-4" onClick={e => e.stopPropagation()}>
        {estaCompletando ? (
          <div className="space-y-2 pt-2" onClick={e => e.stopPropagation()}>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Lecciones aprendidas <span className="text-red-400">*</span>
            </label>
            <textarea
              value={lecciones}
              onChange={e => alActualizarLecciones(e.target.value)}
              placeholder="¿Qué aprendiste al completar esta tarea?"
              rows={3}
              autoFocus
              className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:border-mmt-purple"
            />
            <div className="flex gap-1.5">
              <button
                onClick={alConfirmarCompletada}
                disabled={!lecciones.trim()}
                className="flex-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-mmt-purple text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
              <button
                onClick={alCancelarCompletada}
                className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-1.5 flex-wrap pt-1">
            {estadoActual !== 'pendiente' && (
              <BotonEstado onClick={() => alCambiarEstado(tarea.id, 'pendiente')} variante="gris">
                ← Pendiente
              </BotonEstado>
            )}
            {estadoActual !== 'en_progreso' && (
              <BotonEstado onClick={() => alCambiarEstado(tarea.id, 'en_progreso')} variante="celeste">
                {estadoActual === 'pendiente' ? 'Iniciar →' : '← En progreso'}
              </BotonEstado>
            )}
            {estadoActual !== 'completada' && (
              <BotonEstado onClick={() => alCambiarEstado(tarea.id, 'completada')} variante="morado">
                Completar
              </BotonEstado>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function BotonEstado({ children, onClick, variante }) {
  const clases = {
    morado:  'bg-mmt-purple-100 text-mmt-purple hover:bg-mmt-purple hover:text-white',
    celeste: 'bg-mmt-celeste-100 text-mmt-celeste-dark hover:bg-mmt-celeste hover:text-white',
    gris:    'bg-gray-100 text-gray-500 hover:bg-gray-200',
  }
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${clases[variante]}`}
    >
      {children}
    </button>
  )
}

function SelectorAsignadas({ alumnas, seleccionadas, onChange }) {
  function toggle(id) {
    const idNum = Number(id)
    onChange(
      seleccionadas.includes(idNum)
        ? seleccionadas.filter(x => x !== idNum)
        : [...seleccionadas, idNum]
    )
  }
  return (
    <div className="border border-gray-200 rounded-xl p-2 max-h-36 overflow-y-auto space-y-1">
      {alumnas.map(a => (
        <label key={a.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg">
          <input
            type="checkbox"
            checked={seleccionadas.includes(Number(a.id))}
            onChange={() => toggle(a.id)}
            className="accent-mmt-purple"
          />
          <span className="text-gray-700">{a.nombre}</span>
          <span className="ml-auto text-[10px] text-gray-400">{a.rol}</span>
        </label>
      ))}
      {alumnas.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">Sin usuarias disponibles</p>
      )}
    </div>
  )
}
