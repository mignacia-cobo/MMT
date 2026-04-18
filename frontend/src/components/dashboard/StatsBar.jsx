import { useState, useEffect } from 'react'
import { apiFetch }            from '../../hooks/useApi'
import { useSesion }           from '../../context/SesionContext'

export default function StatsBar() {
  const { alumna } = useSesion()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!alumna) return

    if (alumna.rol === 'ADMIN') {
      apiFetch('/api/admin/metricas')
        .then(j => setStats([
          { value: j.totales.total_alumnas,      label: 'Alumnas activas',    color: 'text-mmt-purple'      },
          { value: j.totales.tareas_completadas,  label: 'Tareas completadas', color: 'text-mmt-celeste-dark' },
          { value: j.totales.total_materiales,    label: 'Materiales subidos', color: 'text-mmt-purple'      },
          { value: j.totales.proyectos_activos,   label: 'Proyectos activos',  color: 'text-mmt-celeste-dark' },
        ]))
        .catch(() => {})
    } else {
      Promise.all([
        apiFetch('/api/materiales?limite=1'),
        apiFetch('/api/tareas?estado=COMPLETADA'),
        apiFetch('/api/hitos'),
        apiFetch('/api/proyectos'),
      ]).then(([mats, tareas, hitos, projs]) => {
        setStats([
          { value: mats.datos?.length  ?? 0,   label: 'Materiales disponibles', color: 'text-mmt-purple'       },
          { value: tareas.tareas?.length ?? 0,  label: 'Tareas completadas',     color: 'text-mmt-celeste-dark' },
          { value: hitos.hitos?.length  ?? 0,   label: 'Hitos del programa',     color: 'text-mmt-purple'       },
          { value: projs.proyectos?.length ?? 0, label: 'Proyectos activos',     color: 'text-mmt-celeste-dark' },
        ])
      }).catch(() => {})
    }
  }, [alumna?.id, alumna?.rol])

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="card text-center py-5 animate-pulse">
            <div className="h-8 bg-gray-100 rounded mx-auto w-12 mb-2" />
            <div className="h-3 bg-gray-100 rounded mx-auto w-20" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ value, label, color }) => (
        <div key={label} className="card text-center py-5">
          <p className={`text-3xl font-extrabold ${color} mb-1`}>{value}</p>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
        </div>
      ))}
    </div>
  )
}
