/*
 * ============================================================
 * components/tareas/TareaModal.jsx  —  Modal de detalle de tarea
 * ============================================================
 *
 * Vista y edición completa de una tarea:
 *   - Metadata (ruta, prioridad, estado, asignadas, creada por)
 *   - Lecciones aprendidas (solo si estado = completada)
 *   - Edición (creadora, cualquier asignada, ADMIN)
 *   - Gestión de asignadas (ADMIN, LIDER, creadora)
 *   - Hilo de comentarios
 */

import { useState, useEffect, useCallback } from 'react'
import { apiFetch }  from '../../hooks/useApi'
import { useSesion } from '../../context/SesionContext'

// -------------------------------------------------------
// CONSTANTES DE VISUALIZACIÓN
// -------------------------------------------------------

const CONFIG_ESTADO = {
  pendiente:   { label: 'Pendiente',   clase: 'bg-gray-100 text-gray-600'               },
  en_progreso: { label: 'En progreso', clase: 'bg-mmt-celeste-100 text-mmt-celeste-dark' },
  completada:  { label: 'Completada',  clase: 'bg-mmt-purple-100 text-mmt-purple-dark'   },
}

const CONFIG_PRIORIDAD = {
  alta:  { label: 'Alta',  clase: 'bg-red-100 text-red-600'       },
  media: { label: 'Media', clase: 'bg-yellow-100 text-yellow-700' },
  baja:  { label: 'Baja',  clase: 'bg-green-100 text-green-600'   },
}

const CONFIG_RUTA = {
  Liderazgo: 'bg-mmt-purple-100 text-mmt-purple',
  Vocación:  'bg-mmt-celeste-100 text-mmt-celeste-dark',
  Proyectos: 'bg-gray-100 text-gray-600',
}

function formatearFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function iniciales(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// -------------------------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------------------------

export default function TareaModal({ tarea: tareaInicial, onCerrar, onActualizar }) {
  const { alumna: sesion } = useSesion()

  const [tarea,           setTarea]           = useState(tareaInicial)
  const [editando,        setEditando]        = useState(false)
  const [formEdit,        setFormEdit]        = useState({})
  const [alumnas,         setAlumnas]         = useState([])
  const [proyectos,       setProyectos]       = useState([])
  const [hitos,           setHitos]           = useState([])
  const [guardando,       setGuardando]       = useState(false)
  const [errorEdit,       setErrorEdit]       = useState(null)

  const [comentarios,     setComentarios]     = useState([])
  const [cargandoComents, setCargandoComents] = useState(true)
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [enviando,        setEnviando]        = useState(false)

  // ¿Puede editar campos? — creadora, cualquier asignada, o ADMIN
  const estaAsignada = tarea.asignadas?.some(a => a.id === sesion?.id)
  const esCreadora   = tarea.id_creada_por === sesion?.id
  const esAdmin      = sesion?.rol === 'ADMIN'
  const esLider      = sesion?.rol === 'LIDER'
  const puedeEditar  = esCreadora || estaAsignada || esAdmin
  const puedeAsignar = esAdmin || esLider || esCreadora
  const puedeEliminar = esAdmin

  const cargarComentarios = useCallback(async () => {
    setCargandoComents(true)
    try {
      const json = await apiFetch(`/api/tareas/${tarea.id}/comentarios`)
      setComentarios(json.comentarios)
    } catch {
      setComentarios([])
    } finally {
      setCargandoComents(false)
    }
  }, [tarea.id])

  useEffect(() => { cargarComentarios() }, [cargarComentarios])

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar])

  // Cargar alumnas, proyectos e hitos al entrar en modo edición
  useEffect(() => {
    if (!editando || !puedeAsignar) return
    apiFetch('/api/tareas/alumnas')
      .then(json => setAlumnas(json.alumnas ?? []))
      .catch(() => setAlumnas([]))
    apiFetch('/api/proyectos')
      .then(json => setProyectos(json.proyectos ?? []))
      .catch(() => setProyectos([]))
    apiFetch('/api/hitos')
      .then(json => setHitos(json.hitos ?? []))
      .catch(() => setHitos([]))
  }, [editando, puedeAsignar])

  async function eliminarTarea() {
    if (!window.confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) return
    try {
      await apiFetch(`/api/tareas/${tarea.id}`, { method: 'DELETE' })
      if (onActualizar) onActualizar()
      onCerrar()
    } catch (err) {
      alert(err.message)
    }
  }

  function abrirEdicion() {
    setFormEdit({
      titulo:      tarea.titulo,
      descripcion: tarea.descripcion ?? '',
      prioridad:   tarea.prioridad?.toUpperCase() ?? 'MEDIA',
      ruta:        tarea.ruta === 'Liderazgo' ? 'LIDERAZGO'
                 : tarea.ruta === 'Vocación'  ? 'VOCACION'
                 : 'PROYECTOS',
      idsAsignadas: tarea.asignadas?.map(a => Number(a.id)) ?? [],
      idProyecto:   tarea.id_proyecto ? String(tarea.id_proyecto) : '',
      idHito:       tarea.id_hito     ? String(tarea.id_hito)     : '',
      fechaLimite:  tarea.fecha_limite ? tarea.fecha_limite.substring(0, 10) : '',
      idCreadaPor:  String(tarea.id_creada_por ?? ''),
    })
    setErrorEdit(null)
    setEditando(true)
  }

  async function guardarEdicion(e) {
    e.preventDefault()
    if (!formEdit.titulo?.trim()) { setErrorEdit('El título es obligatorio.'); return }
    setGuardando(true)
    setErrorEdit(null)
    try {
      // Actualizar campos de la tarea
      const payload = {
        titulo:      formEdit.titulo.trim(),
        descripcion: formEdit.descripcion?.trim() || null,
        prioridad:   formEdit.prioridad,
        ruta:        formEdit.ruta,
        idProyecto:  formEdit.idProyecto  ? Number(formEdit.idProyecto)  : null,
        idHito:      formEdit.idHito      ? Number(formEdit.idHito)      : null,
        fechaLimite: formEdit.fechaLimite || null,
      }
      if (esAdmin && formEdit.idCreadaPor) payload.idCreadaPor = Number(formEdit.idCreadaPor)

      const respuesta = await apiFetch(`/api/tareas/${tarea.id}`, {
        method: 'PATCH',
        body:   JSON.stringify(payload),
      })

      // Actualizar asignadas (solo si tiene permiso)
      if (puedeAsignar) {
        await apiFetch(`/api/tareas/${tarea.id}/asignar`, {
          method: 'PATCH',
          body:   JSON.stringify({ idsAlumnas: formEdit.idsAsignadas }),
        })
      }

      // Recargar tarea actualizada
      const frescos = await apiFetch(`/api/tareas/${tarea.id}`)
      setTarea(frescos.tarea)
      setEditando(false)
      if (onActualizar) onActualizar()
    } catch (err) {
      setErrorEdit(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function enviarComentario(e) {
    e.preventDefault()
    if (!nuevoComentario.trim() || enviando) return
    setEnviando(true)
    try {
      await apiFetch(`/api/tareas/${tarea.id}/comentarios`, {
        method: 'POST',
        body:   JSON.stringify({ contenido: nuevoComentario.trim() }),
      })
      setNuevoComentario('')
      await cargarComentarios()
    } catch (err) {
      alert(err.message)
    } finally {
      setEnviando(false)
    }
  }

  function toggleAsignada(id) {
    const idNum = Number(id)
    setFormEdit(f => ({
      ...f,
      idsAsignadas: f.idsAsignadas.includes(idNum)
        ? f.idsAsignadas.filter(x => x !== idNum)
        : [...f.idsAsignadas, idNum],
    }))
  }

  const estado    = CONFIG_ESTADO[tarea.estado]
  const prioridad = CONFIG_PRIORIDAD[tarea.prioridad]

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCerrar}
    >
      {/* Panel */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >

        {/* ---- Encabezado ---- */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-bold text-gray-800 leading-snug">{tarea.titulo}</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${CONFIG_RUTA[tarea.ruta] ?? 'bg-gray-100 text-gray-600'}`}>
                {tarea.ruta}
              </span>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${prioridad?.clase}`}>
                {prioridad?.label}
              </span>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${estado?.clase}`}>
                {estado?.label}
              </span>
            </div>
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
                onClick={eliminarTarea}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                title="Eliminar tarea"
              >
                Eliminar
              </button>
            )}
            <button
              onClick={onCerrar}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ---- Contenido con scroll ---- */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">

          {/* ---- Modo EDICIÓN ---- */}
          {editando ? (
            <form onSubmit={guardarEdicion} className="p-6 space-y-4">
              {errorEdit && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorEdit}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Título <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formEdit.titulo}
                    onChange={e => setFormEdit(f => ({ ...f, titulo: e.target.value }))}
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
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Prioridad</label>
                  <select
                    value={formEdit.prioridad}
                    onChange={e => setFormEdit(f => ({ ...f, prioridad: e.target.value }))}
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
                    value={formEdit.descripcion}
                    onChange={e => setFormEdit(f => ({ ...f, descripcion: e.target.value }))}
                    rows={3}
                    className="input-field w-full py-2 text-sm resize-none"
                    placeholder="Descripción opcional"
                  />
                </div>

                {puedeAsignar && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Proyecto asociado</label>
                    <select
                      value={formEdit.idProyecto}
                      onChange={e => setFormEdit(f => ({ ...f, idProyecto: e.target.value }))}
                      className="input-field w-full py-2 text-sm"
                    >
                      <option value="">Sin proyecto</option>
                      {proyectos.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                {puedeAsignar && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Hito del cronograma</label>
                    <select
                      value={formEdit.idHito}
                      onChange={e => setFormEdit(f => ({ ...f, idHito: e.target.value }))}
                      className="input-field w-full py-2 text-sm"
                    >
                      <option value="">Sin hito</option>
                      {hitos.map(h => (
                        <option key={h.id} value={h.id}>{h.titulo} — {formatearFecha(h.fecha)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha límite</label>
                  <input
                    type="date"
                    value={formEdit.fechaLimite}
                    onChange={e => setFormEdit(f => ({ ...f, fechaLimite: e.target.value }))}
                    className="input-field w-full py-2 text-sm"
                  />
                </div>

                {esAdmin && alumnas.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Responsable (creadora)
                      <span className="ml-1 text-[10px] text-mmt-purple font-bold">ADMIN</span>
                    </label>
                    <select
                      value={formEdit.idCreadaPor}
                      onChange={e => setFormEdit(f => ({ ...f, idCreadaPor: e.target.value }))}
                      className="input-field w-full py-2 text-sm"
                    >
                      {alumnas.map(a => (
                        <option key={a.id} value={a.id}>{a.nombre} ({a.rol})</option>
                      ))}
                    </select>
                  </div>
                )}

                {puedeAsignar && alumnas.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Asignadas</label>
                    <div className="border border-gray-200 rounded-xl p-2 max-h-36 overflow-y-auto space-y-1">
                      {alumnas.map(a => (
                        <label key={a.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formEdit.idsAsignadas?.includes(Number(a.id))}
                            onChange={() => toggleAsignada(a.id)}
                            className="accent-mmt-purple"
                          />
                          <span className="text-gray-700">{a.nombre}</span>
                          <span className="ml-auto text-[10px] text-gray-400">{a.rol}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="btn-primary text-xs py-2 px-5 disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          ) : (

          /* ---- Modo VISTA ---- */
          <>
            <div className="p-6 space-y-4">
              {tarea.descripcion && (
                <p className="text-sm text-gray-600 leading-relaxed">{tarea.descripcion}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Creada por</p>
                  <p className="text-gray-700 font-medium">{tarea.nombre_creadora ?? '—'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Asignada a</p>
                  {tarea.asignadas?.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {tarea.asignadas.map(a => (
                        <span key={a.id} className="inline-flex items-center px-2 py-0.5 rounded-full bg-mmt-purple-100 text-mmt-purple text-[10px] font-semibold">
                          {a.nombre}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Sin asignar (libre)</p>
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Creada</p>
                  <p className="text-gray-700">{formatearFecha(tarea.creado_en)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Última actualización</p>
                  <p className="text-gray-700">{formatearFecha(tarea.actualizado_en)}</p>
                </div>
                {tarea.fecha_limite && (
                  <div className="space-y-0.5">
                    <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Fecha límite</p>
                    <p className="text-mmt-purple font-semibold">{formatearFecha(tarea.fecha_limite)}</p>
                  </div>
                )}
                {tarea.titulo_hito && (
                  <div className="col-span-2 space-y-0.5">
                    <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Hito asociado</p>
                    <p className="text-gray-700 font-medium">
                      {tarea.titulo_hito}
                      {tarea.fecha_hito && (
                        <span className="ml-2 text-[10px] text-mmt-celeste-dark font-semibold">
                          ({formatearFecha(tarea.fecha_hito)})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {tarea.estado === 'completada' && tarea.lecciones && (
              <div className="p-6">
                <p className="text-[10px] font-bold text-mmt-purple uppercase tracking-wider mb-2">
                  Lecciones aprendidas
                </p>
                <blockquote className="text-sm text-gray-700 italic border-l-4 border-mmt-purple pl-4 leading-relaxed">
                  "{tarea.lecciones}"
                </blockquote>
              </div>
            )}
          </>
          )}

          {/* ---- Hilo de comentarios (siempre visible) ---- */}
          {!editando && (
            <div className="p-6 space-y-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Comentarios {!cargandoComents && `(${comentarios.length})`}
              </p>

              {cargandoComents ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-mmt-purple/30 border-t-mmt-purple rounded-full animate-spin" />
                </div>
              ) : comentarios.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">
                  Sin comentarios aún. ¡Sé la primera en comentar!
                </p>
              ) : (
                <div className="space-y-4">
                  {comentarios.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mmt-purple to-mmt-celeste
                                      flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {iniciales(c.nombre_alumna)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-gray-800">{c.nombre_alumna}</span>
                          <span className="text-[10px] text-gray-400">{formatearFecha(c.creado_en)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{c.contenido}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={enviarComentario} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={nuevoComentario}
                  onChange={e => setNuevoComentario(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="input-field flex-1 text-sm py-2"
                  disabled={enviando}
                />
                <button
                  type="submit"
                  disabled={!nuevoComentario.trim() || enviando}
                  className="btn-primary text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {enviando ? '...' : 'Enviar'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

