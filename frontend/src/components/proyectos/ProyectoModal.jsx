/*
 * ============================================================
 * components/proyectos/ProyectoModal.jsx
 * ============================================================
 *
 * Muestra el detalle completo de un proyecto:
 *   - Metadata (ruta, estado, postulante, equipo asignado, fecha)
 *   - Gestión de equipo (ADMIN/LIDER): selector de miembros
 *   - Resumen y lista de tareas asociadas (con multi-asignadas)
 *   - Las alumnas del equipo pueden ver y gestionar sus tareas
 *
 * Cierra con X, Escape o click en backdrop.
 */

import { useState, useEffect, useCallback } from 'react'
import { apiFetch }  from '../../hooks/useApi'
import { useSesion } from '../../context/SesionContext'
import TareaModal    from '../tareas/TareaModal'

// -------------------------------------------------------
// CONSTANTES
// -------------------------------------------------------

const CONFIG_ESTADO_PROYECTO = {
  PENDIENTE:   { label: 'Pendiente',   clase: 'bg-gray-100 text-gray-600'               },
  EN_REVISION: { label: 'En revisión', clase: 'bg-yellow-100 text-yellow-700'            },
  APROBADO:    { label: 'Aprobado',    clase: 'bg-green-100 text-green-700'              },
  FINALIZADO:  { label: 'Finalizado',  clase: 'bg-mmt-purple-100 text-mmt-purple-dark'   },
}

const CONFIG_RUTA = {
  LIDERAZGO: { label: 'Liderazgo', clase: 'bg-mmt-purple-100 text-mmt-purple'       },
  VOCACION:  { label: 'Vocación',  clase: 'bg-mmt-celeste-100 text-mmt-celeste-dark' },
  PROYECTOS: { label: 'Proyectos', clase: 'bg-gray-100 text-gray-600'               },
}

const CONFIG_ESTADO_TAREA = {
  PENDIENTE:   { label: 'Pendiente',   punto: 'bg-gray-300',    clase: 'bg-gray-100 text-gray-500'               },
  EN_PROGRESO: { label: 'En progreso', punto: 'bg-mmt-celeste', clase: 'bg-mmt-celeste-100 text-mmt-celeste-dark' },
  COMPLETADA:  { label: 'Completada',  punto: 'bg-mmt-purple',  clase: 'bg-mmt-purple-100 text-mmt-purple-dark'   },
}

const CONFIG_PRIORIDAD = {
  ALTA:  { label: 'Alta',  clase: 'bg-red-100 text-red-600'       },
  MEDIA: { label: 'Media', clase: 'bg-yellow-100 text-yellow-700' },
  BAJA:  { label: 'Baja',  clase: 'bg-green-100 text-green-600'   },
}

const CONFIG_SIGUIENTE = {
  PENDIENTE:   ['EN_REVISION'],
  EN_REVISION: ['APROBADO', 'PENDIENTE'],
  APROBADO:    ['FINALIZADO', 'EN_REVISION'],
  FINALIZADO:  [],
}

const LABEL_ESTADOS = {
  PENDIENTE: 'Pendiente', EN_REVISION: 'En revisión', APROBADO: 'Aprobado', FINALIZADO: 'Finalizado',
}

function formatearFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

// -------------------------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------------------------

export default function ProyectoModal({ proyecto: proyectoInicial, esAdmin, esLider, alumnaId, onCerrar, alCambiarEstado, onActualizar }) {
  const { alumna: sesion } = useSesion()

  const [proyecto,       setProyecto]       = useState(proyectoInicial)
  const [tareas,         setTareas]         = useState([])
  const [cargando,       setCargando]       = useState(true)
  const [tareaAbierta,   setTareaAbierta]   = useState(null)

  // Edición del proyecto
  const [editando,       setEditando]       = useState(false)
  const [formEdit,       setFormEdit]       = useState({})
  const [guardando,      setGuardando]      = useState(false)
  const [errorEdit,      setErrorEdit]      = useState(null)

  // Gestión de equipo
  const [alumnas,        setAlumnas]        = useState([])
  const [editandoEquipo, setEditandoEquipo] = useState(false)
  const [idsSelec,       setIdsSelec]       = useState([])
  const [guardandoEq,    setGuardandoEq]    = useState(false)
  const [errorEq,        setErrorEq]        = useState(null)

  const puedeGestionarEquipo = esAdmin || esLider

  const esMiembro = proyecto.asignadas?.some(a => a.id === sesion?.id)
    || proyecto.id_postulante === sesion?.id

  const puedeEditar    = esMiembro || esAdmin
  const puedeEliminar  = esAdmin

  const cargarTareas = useCallback(async () => {
    setCargando(true)
    try {
      const json = await apiFetch(`/api/proyectos/${proyecto.id}/tareas`)
      setTareas(json.tareas)
    } catch {
      setTareas([])
    } finally {
      setCargando(false)
    }
  }, [proyecto.id])

  useEffect(() => { cargarTareas() }, [cargarTareas])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar])

  async function eliminarProyecto() {
    if (!window.confirm('¿Eliminar este proyecto? Se eliminarán también sus asociaciones.')) return
    try {
      await apiFetch(`/api/proyectos/${proyecto.id}`, { method: 'DELETE' })
      if (onActualizar) onActualizar()
      onCerrar()
    } catch (err) {
      alert(err.message)
    }
  }

  async function guardarEdicion(e) {
    e.preventDefault()
    if (!formEdit.nombre?.trim()) { setErrorEdit('El nombre es obligatorio.'); return }
    setGuardando(true)
    setErrorEdit(null)
    try {
      const json = await apiFetch(`/api/proyectos/${proyecto.id}`, {
        method: 'PATCH',
        body:   JSON.stringify({
          nombre:      formEdit.nombre.trim(),
          descripcion: formEdit.descripcion?.trim() || null,
          ruta:        formEdit.ruta,
        }),
      })

      // ADMIN puede cambiar la postulante/creadora
      if (esAdmin && formEdit.idPostulante && Number(formEdit.idPostulante) !== proyecto.id_postulante) {
        await apiFetch(`/api/proyectos/${proyecto.id}/postulante`, {
          method: 'PATCH',
          body:   JSON.stringify({ idPostulante: Number(formEdit.idPostulante) }),
        })
      }
      setProyecto(json.proyecto)
      setEditando(false)
      if (onActualizar) onActualizar()
    } catch (err) {
      setErrorEdit(err.message)
    } finally {
      setGuardando(false)
    }
  }

  function cargarAlumnas() {
    if (alumnas.length > 0) return
    apiFetch('/api/proyectos/alumnas')
      .then(json => setAlumnas(json.alumnas ?? []))
      .catch(() => setAlumnas([]))
  }

  function abrirEdicion() {
    setFormEdit({
      nombre:       proyecto.nombre,
      descripcion:  proyecto.descripcion ?? '',
      ruta:         proyecto.ruta,
      idPostulante: String(proyecto.id_postulante ?? ''),
    })
    setErrorEdit(null)
    if (esAdmin) cargarAlumnas()
    setEditando(true)
  }

  function abrirEdicionEquipo() {
    setIdsSelec(proyecto.asignadas?.map(a => Number(a.id)) ?? [])
    setErrorEq(null)
    cargarAlumnas()
    setEditandoEquipo(true)
  }

  function toggleMiembro(id) {
    const idNum = Number(id)
    setIdsSelec(prev =>
      prev.includes(idNum) ? prev.filter(x => x !== idNum) : [...prev, idNum]
    )
  }

  async function guardarEquipo() {
    setGuardandoEq(true)
    setErrorEq(null)
    try {
      const json = await apiFetch(`/api/proyectos/${proyecto.id}/asignar`, {
        method: 'PATCH',
        body:   JSON.stringify({ idsAlumnas: idsSelec }),
      })
      setProyecto(json.proyecto)
      setEditandoEquipo(false)
      if (onActualizar) onActualizar()
    } catch (err) {
      setErrorEq(err.message)
    } finally {
      setGuardandoEq(false)
    }
  }

  const estadoProyecto = CONFIG_ESTADO_PROYECTO[proyecto.estado] ?? { label: proyecto.estado, clase: 'bg-gray-100 text-gray-600' }
  const rutaProyecto   = CONFIG_RUTA[proyecto.ruta]              ?? { label: proyecto.ruta,   clase: 'bg-gray-100 text-gray-600' }

  const contadores = {
    PENDIENTE:   tareas.filter(t => t.estado === 'PENDIENTE').length,
    EN_PROGRESO: tareas.filter(t => t.estado === 'EN_PROGRESO').length,
    COMPLETADA:  tareas.filter(t => t.estado === 'COMPLETADA').length,
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >

        {/* ---- Encabezado ---- */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${rutaProyecto.clase}`}>
                  {rutaProyecto.label}
                </span>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${estadoProyecto.clase}`}>
                  {estadoProyecto.label}
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-800 leading-snug">{proyecto.nombre}</h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {puedeEditar && !editando && (
                <button
                  onClick={abrirEdicion}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-mmt-purple hover:text-white transition-colors"
                >
                  Editar
                </button>
              )}
              {puedeEliminar && !editando && (
                <button
                  onClick={eliminarProyecto}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  Eliminar
                </button>
              )}
              <button
                onClick={onCerrar}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* ---- Contenido con scroll ---- */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">

          {/* ---- Modo EDICIÓN ---- */}
          {editando && (
            <form onSubmit={guardarEdicion} className="p-6 space-y-4">
              {errorEdit && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorEdit}</p>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Nombre <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formEdit.nombre}
                    onChange={e => setFormEdit(f => ({ ...f, nombre: e.target.value }))}
                    className="input-field w-full py-2 text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Ruta</label>
                  <select
                    value={formEdit.ruta}
                    onChange={e => setFormEdit(f => ({ ...f, ruta: e.target.value }))}
                    className="input-field w-full py-2 text-sm"
                  >
                    <option value="LIDERAZGO">Liderazgo</option>
                    <option value="VOCACION">Vocación</option>
                    <option value="PROYECTOS">Proyectos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                  <textarea
                    value={formEdit.descripcion}
                    onChange={e => setFormEdit(f => ({ ...f, descripcion: e.target.value }))}
                    rows={3}
                    className="input-field w-full py-2 text-sm resize-none"
                    placeholder="Descripción opcional"
                  />
                </div>
                {esAdmin && alumnas.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Postulante / Creadora
                      <span className="ml-1 text-[10px] text-mmt-purple font-bold">ADMIN</span>
                    </label>
                    <select
                      value={formEdit.idPostulante}
                      onChange={e => setFormEdit(f => ({ ...f, idPostulante: e.target.value }))}
                      className="input-field w-full py-2 text-sm"
                    >
                      {alumnas.map(a => (
                        <option key={a.id} value={a.id}>{a.nombre} ({a.rol})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="text-xs font-semibold px-4 py-1.5 rounded-xl bg-mmt-purple text-white disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}

          {/* Descripción y metadata */}
          <div className="p-6 space-y-4">
            {proyecto.descripcion && (
              <p className="text-sm text-gray-600 leading-relaxed">{proyecto.descripcion}</p>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Postulante</p>
                <p className="text-gray-700 font-medium mt-0.5">{proyecto.nombre_postulante ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Líder</p>
                <p className="text-gray-700 font-medium mt-0.5">{proyecto.nombre_lider ?? <span className="italic text-gray-400">Sin asignar</span>}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Fecha postulación</p>
                <p className="text-gray-700 mt-0.5">{formatearFecha(proyecto.creado_en)}</p>
              </div>
            </div>

            {/* Equipo asignado */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Equipo del proyecto</p>
                {puedeGestionarEquipo && !editandoEquipo && (
                  <button
                    onClick={abrirEdicionEquipo}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-mmt-purple hover:text-white transition-colors"
                  >
                    Gestionar equipo
                  </button>
                )}
              </div>

              {editandoEquipo ? (
                <div className="space-y-2">
                  {errorEq && <p className="text-xs text-red-500">{errorEq}</p>}
                  <div className="border border-gray-200 rounded-xl p-2 max-h-40 overflow-y-auto space-y-1">
                    {alumnas.map(a => (
                      <label key={a.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg">
                        <input
                          type="checkbox"
                          checked={idsSelec.includes(Number(a.id))}
                          onChange={() => toggleMiembro(a.id)}
                          className="accent-mmt-purple"
                        />
                        <span className="text-gray-700">{a.nombre}</span>
                        <span className="ml-auto text-[10px] text-gray-400">{a.rol}</span>
                      </label>
                    ))}
                    {alumnas.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">Cargando...</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditandoEquipo(false)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={guardarEquipo}
                      disabled={guardandoEq}
                      className="text-xs font-semibold px-4 py-1.5 rounded-xl bg-mmt-purple text-white disabled:opacity-50"
                    >
                      {guardandoEq ? 'Guardando...' : 'Guardar equipo'}
                    </button>
                  </div>
                </div>
              ) : proyecto.asignadas?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {proyecto.asignadas.map(a => (
                    <span key={a.id} className="inline-flex items-center px-2.5 py-1 rounded-full bg-mmt-purple-100 text-mmt-purple text-[10px] font-semibold">
                      {a.nombre}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Sin miembros asignados aún.</p>
              )}
            </div>

            {/* Acciones de estado para ADMIN */}
            {esAdmin && (CONFIG_SIGUIENTE[proyecto.estado] ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-gray-400 font-semibold self-center">Mover a:</span>
                {CONFIG_SIGUIENTE[proyecto.estado].map(sig => (
                  <button
                    key={sig}
                    onClick={() => { alCambiarEstado(proyecto.id, sig); onCerrar() }}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-mmt-purple hover:text-white transition-colors"
                  >
                    {LABEL_ESTADOS[sig]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tareas del proyecto */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Tareas del proyecto
              </p>
              {!cargando && <span className="text-xs text-gray-400">{tareas.length} total</span>}
            </div>

            {!cargando && tareas.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CONFIG_ESTADO_TAREA).map(([clave, cfg]) => (
                  <div key={clave} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className={`w-2 h-2 rounded-full ${cfg.punto}`} />
                      <span className="text-[10px] font-semibold text-gray-600">{cfg.label}</span>
                    </div>
                    <p className="text-2xl font-extrabold text-gray-800">{contadores[clave]}</p>
                  </div>
                ))}
              </div>
            )}

            {cargando ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-mmt-purple/30 border-t-mmt-purple rounded-full animate-spin" />
              </div>
            ) : tareas.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                Este proyecto no tiene tareas asociadas aún.
              </p>
            ) : (
              <div className="space-y-2">
                {tareas.map(t => {
                  const cfgEstado = CONFIG_ESTADO_TAREA[t.estado]
                  const cfgPrior  = CONFIG_PRIORIDAD[t.prioridad]
                  // Puede abrir el modal si es miembro del equipo, admin o lider
                  const puedeAbrir = esAdmin || esLider || esMiembro
                  const tNormalizada = {
                    ...t,
                    estado:    t.estado?.toLowerCase(),
                    prioridad: t.prioridad?.toLowerCase(),
                    ruta:      t.ruta === 'LIDERAZGO' ? 'Liderazgo' : t.ruta === 'VOCACION' ? 'Vocación' : 'Proyectos',
                    id_proyecto: proyecto.id,
                  }
                  return (
                    <div
                      key={t.id}
                      className={`flex items-start gap-3 p-3 bg-gray-50 rounded-xl ${puedeAbrir ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                      onClick={puedeAbrir ? () => setTareaAbierta(tNormalizada) : undefined}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfgEstado?.punto ?? 'bg-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-gray-800 truncate">{t.titulo}</p>
                          {cfgPrior && (
                            <span className={`text-[9px] font-bold px-1.5 py-px rounded-full ${cfgPrior.clase}`}>
                              {cfgPrior.label}
                            </span>
                          )}
                        </div>
                        {t.asignadas?.length > 0 && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            → {t.asignadas.map(a => a.nombre).join(', ')}
                          </p>
                        )}
                        {t.estado === 'COMPLETADA' && t.lecciones && (
                          <p className="text-[10px] text-mmt-purple italic mt-1 line-clamp-1">
                            "{t.lecciones}"
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-[9px] font-semibold px-2 py-1 rounded-full ${cfgEstado?.clase ?? ''}`}>
                          {cfgEstado?.label}
                        </span>
                        {puedeAbrir && (
                          <span className="text-[10px] text-gray-300">→</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* TareaModal anidado */}
      {tareaAbierta && (
        <TareaModal
          tarea={tareaAbierta}
          onCerrar={() => setTareaAbierta(null)}
          onActualizar={() => { cargarTareas(); setTareaAbierta(null) }}
        />
      )}
    </div>
  )
}

