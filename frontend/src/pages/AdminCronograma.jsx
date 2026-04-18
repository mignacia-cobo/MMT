/*
 * pages/AdminCronograma.jsx
 * Planificador de cronograma exclusivo para ADMIN.
 * Permite crear, editar, eliminar y reordenar hitos del programa.
 * El panel derecho muestra la vista previa en tiempo real.
 */

import { useState, useEffect, useCallback } from 'react'
import { Navigate }          from 'react-router-dom'
import { useSesion }         from '../context/SesionContext'
import { apiFetch }          from '../hooks/useApi'
import CronogramaTimeline    from '../components/ui/CronogramaTimeline'

// ---- SVG icons ----
function IconCalendar() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function IconEdit() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
function IconTrash() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
function IconArrowUp() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
    </svg>
  )
}
function IconArrowDown() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
    </svg>
  )
}

// ---- Configuracion visual por tipo ----
const CONFIG_TIPO = {
  PASADO:  { label: 'Completado',  clase: 'bg-gray-100 text-gray-600',               punto: 'bg-gray-300'    },
  ACTUAL:  { label: 'En curso',    clase: 'bg-mmt-purple-100 text-mmt-purple',        punto: 'bg-mmt-purple'  },
  FUTURO:  { label: 'Proximo',     clase: 'bg-mmt-celeste-50 text-mmt-celeste-dark',  punto: 'bg-mmt-celeste/50' },
}

const FORM_VACIO = { titulo: '', descripcion: '', fecha: '', tipo: 'FUTURO', orden: 0 }

function formatearFecha(fechaStr) {
  if (!fechaStr) return ''
  const [y, m, d] = fechaStr.substring(0, 10).split('-')
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

// -------------------------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------------------------

export default function AdminCronograma() {
  const { alumna } = useSesion()

  // Proteccion de ruta — solo ADMIN
  if (!alumna) return null
  if (alumna.rol !== 'ADMIN') return <Navigate to="/" replace />

  return <PlanificadorCronograma />
}

export function PlanificadorCronograma() {
  const [hitos,        setHitos]        = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [error,        setError]        = useState(null)
  const [form,         setForm]         = useState(FORM_VACIO)
  const [editandoId,   setEditandoId]   = useState(null)   // id del hito en edicion
  const [mostrarForm,  setMostrarForm]  = useState(false)
  const [guardando,    setGuardando]    = useState(false)
  const [errorForm,    setErrorForm]    = useState(null)
  const [previewKey,   setPreviewKey]   = useState(0)      // fuerza re-render del preview

  const cargarHitos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const json = await apiFetch('/api/hitos?conTareas=1')
      setHitos(json.hitos ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarHitos() }, [cargarHitos])

  // Abre el formulario para crear un nuevo hito
  function iniciarCreacion() {
    setForm(FORM_VACIO)
    setEditandoId(null)
    setErrorForm(null)
    setMostrarForm(true)
  }

  // Abre el formulario cargado con los datos del hito a editar
  function iniciarEdicion(hito) {
    setForm({
      titulo:      hito.titulo,
      descripcion: hito.descripcion ?? '',
      fecha:       hito.fecha ? hito.fecha.substring(0, 10) : '',
      tipo:        hito.tipo,
      orden:       hito.orden,
    })
    setEditandoId(hito.id)
    setErrorForm(null)
    setMostrarForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelar() {
    setMostrarForm(false)
    setEditandoId(null)
    setForm(FORM_VACIO)
    setErrorForm(null)
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.titulo.trim()) { setErrorForm('El titulo es obligatorio.'); return }
    if (!form.fecha)         { setErrorForm('La fecha es obligatoria.');  return }

    setGuardando(true)
    setErrorForm(null)
    try {
      const payload = {
        titulo:      form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        fecha:       form.fecha,
        tipo:        form.tipo,
        orden:       Number(form.orden) || 0,
      }

      if (editandoId) {
        await apiFetch(`/api/hitos/${editandoId}`, {
          method: 'PATCH',
          body:   JSON.stringify(payload),
        })
      } else {
        await apiFetch('/api/hitos', {
          method: 'POST',
          body:   JSON.stringify(payload),
        })
      }

      cancelar()
      await cargarHitos()
      setPreviewKey(k => k + 1)
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id) {
    if (!window.confirm('Eliminar este hito del cronograma?')) return
    try {
      await apiFetch(`/api/hitos/${id}`, { method: 'DELETE' })
      await cargarHitos()
      setPreviewKey(k => k + 1)
    } catch (err) {
      alert(err.message)
    }
  }

  // Sube un hito en el orden (decrementa su orden)
  async function subirOrden(hito, idx) {
    if (idx === 0) return
    const anterior = hitos[idx - 1]
    try {
      await Promise.all([
        apiFetch(`/api/hitos/${hito.id}`,    { method: 'PATCH', body: JSON.stringify({ orden: anterior.orden }) }),
        apiFetch(`/api/hitos/${anterior.id}`, { method: 'PATCH', body: JSON.stringify({ orden: hito.orden })    }),
      ])
      await cargarHitos()
      setPreviewKey(k => k + 1)
    } catch (err) {
      alert(err.message)
    }
  }

  async function bajarOrden(hito, idx) {
    if (idx === hitos.length - 1) return
    const siguiente = hitos[idx + 1]
    try {
      await Promise.all([
        apiFetch(`/api/hitos/${hito.id}`,    { method: 'PATCH', body: JSON.stringify({ orden: siguiente.orden }) }),
        apiFetch(`/api/hitos/${siguiente.id}`, { method: 'PATCH', body: JSON.stringify({ orden: hito.orden })    }),
      ])
      await cargarHitos()
      setPreviewKey(k => k + 1)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-mmt-purple text-white flex items-center justify-center">
            <IconCalendar />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">Cronograma MMT 2026</h1>
              <span className="text-[10px] font-bold bg-mmt-purple text-white px-2 py-0.5 rounded-full">ADMIN</span>
            </div>
            <p className="text-sm text-gray-500">Gestiona los hitos que se muestran en la landing publica</p>
          </div>
        </div>
        <button
          onClick={mostrarForm ? cancelar : iniciarCreacion}
          className={mostrarForm ? 'btn-outline py-2 px-4 text-sm' : 'btn-primary py-2 px-4 text-sm'}
        >
          {mostrarForm ? 'Cancelar' : '+ Nuevo hito'}
        </button>
      </div>

      {/* Formulario crear/editar */}
      {mostrarForm && (
        <form onSubmit={guardar} className="card p-6 space-y-5 border-2 border-mmt-purple/20">
          <h2 className="font-bold text-gray-700 text-sm">
            {editandoId ? 'Editar hito' : 'Nuevo hito'}
          </h2>

          {errorForm && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorForm}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Titulo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Titulo <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ej: Demo Day Final 2026"
                className="input-field w-full py-2 text-sm"
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Fecha <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="input-field w-full py-2 text-sm"
              />
            </div>

            {/* Orden */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Orden (desempate)
              </label>
              <input
                type="number"
                value={form.orden}
                onChange={e => setForm(f => ({ ...f, orden: e.target.value }))}
                min="0"
                className="input-field w-full py-2 text-sm"
              />
            </div>

            {/* Tipo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-2">Estado</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CONFIG_TIPO).map(([tipo, cfg]) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, tipo }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all
                      ${form.tipo === tipo
                        ? 'border-mmt-purple bg-mmt-purple text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-mmt-purple/50'
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${form.tipo === tipo ? 'bg-white' : cfg.punto}`} />
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Descripcion */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Descripcion</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Descripcion corta del hito (opcional)"
                rows={2}
                className="input-field w-full py-2 text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={cancelar} className="btn-outline text-sm py-2 px-4">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-primary text-sm py-2 px-5 disabled:opacity-50">
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear hito'}
            </button>
          </div>
        </form>
      )}

      {/* Layout: lista + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Lista de hitos */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
            Hitos del programa ({hitos.length})
          </h2>

          {cargando ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-3 border-mmt-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="card p-4 text-red-500 text-sm">{error}</div>
          ) : hitos.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <p className="text-sm">No hay hitos. Crea el primero con el boton de arriba.</p>
            </div>
          ) : (
            hitos.map((hito, idx) => {
              const cfg = CONFIG_TIPO[hito.tipo] ?? CONFIG_TIPO.FUTURO
              return (
                <div
                  key={hito.id}
                  className={`card p-4 border-l-4 transition-shadow hover:shadow-md
                    ${editandoId === hito.id ? 'border-mmt-purple ring-2 ring-mmt-purple/20' : 'border-gray-100'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Orden buttons */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0 mt-1">
                      <button
                        onClick={() => subirOrden(hito, idx)}
                        disabled={idx === 0}
                        className="p-1 rounded text-gray-300 hover:text-mmt-purple hover:bg-mmt-purple-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="Subir"
                      >
                        <IconArrowUp />
                      </button>
                      <button
                        onClick={() => bajarOrden(hito, idx)}
                        disabled={idx === hitos.length - 1}
                        className="p-1 rounded text-gray-300 hover:text-mmt-purple hover:bg-mmt-purple-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="Bajar"
                      >
                        <IconArrowDown />
                      </button>
                    </div>

                    {/* Punto de estado */}
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${cfg.punto}`} />

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cfg.clase}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-gray-400">{formatearFecha(hito.fecha)}</span>
                      </div>
                      <p className="font-semibold text-sm text-gray-800 truncate">{hito.titulo}</p>
                      {hito.descripcion && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{hito.descripcion}</p>
                      )}
                      {/* Tareas asociadas al hito */}
                      {hito.tareas?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                            Tareas ({hito.tareas.length})
                          </p>
                          {hito.tareas.map(t => (
                            <div key={t.id} className="flex items-center gap-2 text-[10px] bg-gray-50 rounded-lg px-2 py-1">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                t.estado === 'COMPLETADA' ? 'bg-mmt-purple' :
                                t.estado === 'EN_PROGRESO' ? 'bg-mmt-celeste' : 'bg-gray-300'
                              }`} />
                              <span className="flex-1 text-gray-700 truncate">{t.titulo}</span>
                              {t.fecha_limite && (
                                <span className="text-mmt-celeste-dark font-semibold flex-shrink-0">
                                  {t.fecha_limite.substring(0, 10)}
                                </span>
                              )}
                              {t.asignadas?.length > 0 && (
                                <span className="text-gray-400 flex-shrink-0">
                                  {t.asignadas.map(a => a.nombre.split(' ')[0]).join(', ')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => iniciarEdicion(hito)}
                        className="p-2 rounded-xl text-gray-400 hover:text-mmt-purple hover:bg-mmt-purple-50 transition-colors"
                        title="Editar"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={() => eliminar(hito.id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Vista previa */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">
            Vista previa (publica)
          </h2>
          <div className="card p-5 sticky top-24">
            <CronogramaTimeline key={previewKey} />
          </div>
        </div>

      </div>
    </div>
  )
}
