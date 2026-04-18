/*
 * components/ui/CronogramaTimeline.jsx
 * Cronograma de hitos MMT compartido entre Landing y Dashboard.
 * Carga desde /api/hitos — muestra los mismos datos en ambas vistas.
 */

import { useState, useEffect } from 'react'
import { apiFetch } from '../../hooks/useApi'

// ---- SVG icons por estado ----

function IconPasado() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function IconActual() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" opacity="0.15" />
      <polygon points="10 8 16 12 10 16" />
    </svg>
  )
}

function IconFuturo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

const CONFIG = {
  PASADO:  {
    icono:    <IconPasado />,
    circulo:  'bg-gray-200 text-gray-400',
    linea:    'bg-gray-100',
    badge:    'bg-gray-100 text-gray-500',
    titulo:   'text-gray-500',
    pulse:    '',
  },
  ACTUAL: {
    icono:    <IconActual />,
    circulo:  'bg-mmt-purple text-white',
    linea:    'bg-mmt-purple/20',
    badge:    'bg-mmt-purple-100 text-mmt-purple',
    titulo:   'text-mmt-purple font-bold',
    pulse:    'ring-4 ring-mmt-purple/20 animate-pulse',
  },
  FUTURO: {
    icono:    <IconFuturo />,
    circulo:  'bg-mmt-celeste/20 text-mmt-celeste-dark',
    linea:    'bg-gray-50',
    badge:    'bg-mmt-celeste-50 text-mmt-celeste-dark',
    titulo:   'text-gray-600',
    pulse:    '',
  },
}

const LABEL_TIPO = { PASADO: 'Completado', ACTUAL: 'En curso', FUTURO: 'Proximo' }

function formatearFecha(fechaStr) {
  if (!fechaStr) return ''
  const [y, m, d] = fechaStr.substring(0, 10).split('-')
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

const ESTADO_TAREA = {
  PENDIENTE:   { label: 'Pendiente',   punto: 'bg-gray-300',    texto: 'text-gray-500'        },
  EN_PROGRESO: { label: 'En progreso', punto: 'bg-mmt-celeste', texto: 'text-mmt-celeste-dark' },
  COMPLETADA:  { label: 'Completada',  punto: 'bg-mmt-purple',  texto: 'text-mmt-purple'       },
}

const PRIORIDAD_TAREA = {
  ALTA:  'text-red-500',
  MEDIA: 'text-yellow-600',
  BAJA:  'text-green-600',
}

export default function CronogramaTimeline({ compact = false, conTareas = false }) {
  const [hitos,    setHitos]    = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const url = conTareas ? '/api/hitos?conTareas=1' : '/api/hitos'
    apiFetch(url)
      .then(j => setHitos(j.hitos ?? []))
      .catch(() => setHitos([]))
      .finally(() => setCargando(false))
  }, [conTareas])

  if (cargando) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-mmt-purple/30 border-t-mmt-purple rounded-full animate-spin" />
      </div>
    )
  }

  if (hitos.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-6">Sin hitos registrados.</p>
  }

  return (
    <div className="relative">
      {hitos.map((hito, idx) => {
        const cfg    = CONFIG[hito.tipo] ?? CONFIG.FUTURO
        const isLast = idx === hitos.length - 1

        return (
          <div key={hito.id} className="flex gap-4">
            {/* Icono + línea vertical */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.circulo} ${cfg.pulse}`}>
                {cfg.icono}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 my-1 min-h-[28px] ${cfg.linea}`} />
              )}
            </div>

            {/* Contenido */}
            <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-5'}`}>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badge}`}>
                  {LABEL_TIPO[hito.tipo]}
                </span>
                <span className="text-[10px] text-gray-400">{formatearFecha(hito.fecha)}</span>
              </div>
              <p className={`font-semibold text-sm leading-snug ${cfg.titulo}`}>{hito.titulo}</p>
              {!compact && hito.descripcion && (
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{hito.descripcion}</p>
              )}

              {/* Tareas asociadas al hito */}
              {conTareas && hito.tareas?.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {hito.tareas.map(t => {
                    const est  = ESTADO_TAREA[t.estado]    ?? ESTADO_TAREA.PENDIENTE
                    const pClr = PRIORIDAD_TAREA[t.prioridad] ?? 'text-gray-400'
                    return (
                      <div key={t.id} className="bg-gray-50 rounded-xl px-3 py-2 space-y-1">
                        {/* Fila superior: punto estado + título */}
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${est.punto}`} />
                          <span className="text-xs font-medium text-gray-700 flex-1 leading-snug">{t.titulo}</span>
                          <span className={`text-[10px] font-semibold flex-shrink-0 ${pClr}`}>
                            {t.prioridad?.charAt(0) + t.prioridad?.slice(1).toLowerCase()}
                          </span>
                        </div>
                        {/* Fila inferior: fecha límite + asignadas */}
                        {(t.fecha_limite || t.asignadas?.length > 0) && (
                          <div className="flex items-center justify-between pl-3.5 gap-2">
                            {t.fecha_limite ? (
                              <span className="text-[10px] text-mmt-celeste-dark font-semibold">
                                Fecha límite: {formatearFecha(t.fecha_limite)}
                              </span>
                            ) : (
                              <span />
                            )}
                            {t.asignadas?.length > 0 && (
                              <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                → {t.asignadas.map(a => a.nombre.split(' ')[0]).join(', ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
