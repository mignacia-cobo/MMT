const STYLES = {
  purple: {
    bg:       'from-mmt-purple-50 to-white',
    icon:     'bg-mmt-purple text-white',
    bar:      'bg-mmt-purple',
    barBg:    'bg-mmt-purple-100',
    accent:   'text-mmt-purple',
  },
  celeste: {
    bg:       'from-mmt-celeste-50 to-white',
    icon:     'bg-mmt-celeste text-white',
    bar:      'bg-mmt-celeste',
    barBg:    'bg-mmt-celeste-100',
    accent:   'text-mmt-celeste-dark',
  },
  mixed: {
    bg:       'from-mmt-purple-50 via-white to-mmt-celeste-50',
    icon:     'bg-gradient-to-br from-mmt-purple to-mmt-celeste text-white',
    bar:      'bg-gradient-to-r from-mmt-purple to-mmt-celeste',
    barBg:    'bg-gray-100',
    accent:   'text-mmt-purple',
  },
}

export default function RouteCard({ title, icon, color, tasks, completed, description }) {
  const s = STYLES[color]
  const pct = Math.round((completed / tasks) * 100)

  return (
    <div className={`card bg-gradient-to-br ${s.bg} hover:-translate-y-1 transition-transform duration-300`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl ${s.icon} flex items-center justify-center text-xl shadow-sm`}>
          {icon}
        </div>
        <span className={`text-xs font-bold ${s.accent}`}>{pct}%</span>
      </div>

      <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">{description}</p>

      {/* Progress bar */}
      <div className={`h-1.5 rounded-full ${s.barBg} mb-2 overflow-hidden`}>
        <div
          className={`h-full rounded-full ${s.bar} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-gray-400">
        <span className="font-semibold text-gray-600">{completed}</span> de {tasks} tareas completadas
      </p>
    </div>
  )
}
