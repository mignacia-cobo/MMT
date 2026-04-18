/*
 * pages/Landing.jsx
 * Pagina publica del programa MMT Valparaiso.
 * Visible sin sesion: hero animado, noticias en carrusel, cronograma de hitos.
 */

import { useState, useEffect } from 'react'
import { apiFetch }          from '../hooks/useApi'
import NoticiaModal          from '../components/noticias/NoticiaModal'
import CarruselNoticias      from '../components/noticias/CarruselNoticias'
import CronogramaTimeline    from '../components/ui/CronogramaTimeline'
import logoMMT               from '../masmujeresenlastics_logo.jpg'

// -------------------------------------------------------
// SVG ICONS
// -------------------------------------------------------

function IconCalendar({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function IconBook({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}
function IconCode({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  )
}
function IconNewspaper({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    </svg>
  )
}
function IconTarget({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  )
}
function IconStar({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
function IconUsers({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

// -------------------------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------------------------

export default function Landing() {
  const [noticias,         setNoticias]         = useState([])
  const [hitos,            setHitos]            = useState([])
  const [cargandoNoticias, setCargandoNoticias] = useState(true)
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null)
  const [stats, setStats] = useState({ materiales: '—', hitos: '—', noticias: '—', proyectos: '—' })

  useEffect(() => {
    apiFetch('/api/noticias')
      .then(j => setNoticias(j.noticias ?? []))
      .catch(() => {})
      .finally(() => setCargandoNoticias(false))

    apiFetch('/api/estadisticas')
      .then(j => setStats(j))
      .catch(() => {})

    apiFetch('/api/hitos')
      .then(j => setHitos(j.hitos ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-20 pb-16 overflow-x-hidden">

      {/* ============================================================
          HERO — layout 2 columnas
      ============================================================ */}
      <section className="relative overflow-hidden rounded-3xl text-white">

        {/* Fondo gradiente animado */}
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background: 'linear-gradient(135deg, #6B21A8, #7c3aed, #1e40af, #0ea5e9, #6B21A8)',
            backgroundSize: '400% 400%',
          }}
        />

        {/* Círculos decorativos */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-mmt-celeste/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl pointer-events-none" />

        {/* Grid 2 columnas */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[540px]">

          {/* ---- Columna izquierda: contenido ---- */}
          <div className="flex flex-col justify-center px-8 sm:px-12 py-14 space-y-7">

            {/* Logo + badge */}
            <div className="flex items-center gap-4 animate-fade-left">
              <img
                src={logoMMT}
                alt="Más Mujeres en las TICs"
                className="w-16 h-16 rounded-full object-cover shadow-2xl ring-4 ring-white/20 animate-float"
              />
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Cohorte 2026 activa
              </span>
            </div>

            <div className="animate-fade-up delay-100">
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-3">
                MMT Valpo Hub
              </h1>
              <p className="text-white/70 text-base font-medium">
                Más Mujeres en las TICs · Duoc UC Valparaíso
              </p>
            </div>

            <p className="text-white/60 text-sm leading-relaxed animate-fade-up delay-200 max-w-sm">
              Plataforma de gestión para las alumnas del programa MMT.
              Materiales, tareas, proyectos y comunidad en un solo lugar.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 animate-fade-up delay-300">
              {[
                { icon: <IconBook className="w-5 h-5" />,      valor: stats.materiales, label: 'Materiales',  color: 'from-white/10 to-white/5' },
                { icon: <IconCode className="w-5 h-5" />,      valor: stats.proyectos,  label: 'Proyectos',   color: 'from-white/10 to-white/5' },
                { icon: <IconCalendar className="w-5 h-5" />,  valor: stats.hitos,      label: 'Hitos 2026',  color: 'from-white/10 to-white/5' },
                { icon: <IconNewspaper className="w-5 h-5" />, valor: stats.noticias,   label: 'Noticias',    color: 'from-white/10 to-white/5' },
              ].map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} hover:from-white/20 hover:to-white/10 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 transition-all duration-200 cursor-default`}>
                  <span className="text-white/60">{s.icon}</span>
                  <div>
                    <p className="text-2xl font-extrabold leading-none">{s.valor}</p>
                    <p className="text-white/50 text-[11px] mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Columna derecha: panel visual ---- */}
          <div className="hidden lg:flex flex-col justify-center px-10 py-14 animate-fade-up delay-200">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 space-y-4 shadow-2xl">

              {/* Header panel */}
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <img src={logoMMT} alt="MMT" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20" />
                <div>
                  <p className="text-sm font-bold">Panel MMT 2026</p>
                  <p className="text-[11px] text-white/50">3 rutas de desarrollo</p>
                </div>
                <span className="ml-auto w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              </div>

              {/* Stats reales del programa */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { valor: stats.materiales, label: 'Materiales' },
                  { valor: stats.proyectos,  label: 'Proyectos'  },
                  { valor: stats.hitos,      label: 'Hitos'       },
                  { valor: stats.noticias,   label: 'Noticias'   },
                ].map(s => (
                  <div key={s.label} className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                    <p className="text-2xl font-extrabold leading-none">{s.valor}</p>
                    <p className="text-[10px] text-white/50 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Próximos hitos — datos reales */}
              <div className="space-y-2 pt-1 border-t border-white/10">
                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                  Próximos hitos
                </p>
                {hitos.length === 0 ? (
                  <p className="text-xs text-white/30 italic">Sin hitos registrados aún.</p>
                ) : (
                  hitos
                    .filter(h => h.tipo !== 'PASADO')
                    .slice(0, 3)
                    .map(h => {
                      const [y, m, d] = (h.fecha ?? '').substring(0, 10).split('-')
                      const fecha = y ? new Date(Number(y), Number(m) - 1, Number(d))
                        .toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) : ''
                      return (
                        <div key={h.id} className="flex items-start gap-2 text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
                            h.tipo === 'ACTUAL' ? 'bg-green-400 animate-pulse' : 'bg-white/30'
                          }`} />
                          <span className="text-white/70 flex-1 leading-snug line-clamp-1">{h.titulo}</span>
                          {fecha && <span className="text-white/40 flex-shrink-0">{fecha}</span>}
                        </div>
                      )
                    })
                )}
              </div>

              {/* Últimas noticias — datos reales */}
              {noticias.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-white/10">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Últimas noticias</p>
                  {noticias.slice(0, 2).map(n => (
                    <div key={n.id} className="flex items-start gap-2 text-xs text-white/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-mmt-celeste/70 flex-shrink-0 mt-1" />
                      <span className="line-clamp-1 flex-1">{n.titulo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================
          CARACTERÍSTICAS
      ============================================================ */}
      <section>
        <div className="text-center mb-8 animate-fade-up">
          <h2 className="text-2xl font-extrabold text-gray-800">¿Qué puedes hacer?</h2>
          <p className="text-sm text-gray-500 mt-1">Todo lo que necesitas para tu desarrollo en el programa</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: <IconBook className="w-7 h-7" />,
              color: 'bg-mmt-purple-50 text-mmt-purple',
              glow: 'hover:shadow-[0_0_30px_rgba(107,33,168,0.15)]',
              titulo: 'Repositorio de Materiales',
              desc: 'Sube y descarga materiales de estudio organizados por asignatura. Comparte tu trabajo con tus compañeras.',
            },
            {
              icon: <IconTarget className="w-7 h-7" />,
              color: 'bg-mmt-celeste-50 text-mmt-celeste-dark',
              glow: 'hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]',
              titulo: 'Gestión de Tareas',
              desc: 'Tablero Kanban con las 3 rutas del programa: Liderazgo, Vocación y Proyectos. Registra tus avances.',
            },
            {
              icon: <IconCode className="w-7 h-7" />,
              color: 'bg-mmt-purple-50 text-mmt-purple',
              glow: 'hover:shadow-[0_0_30px_rgba(107,33,168,0.15)]',
              titulo: 'Proyectos e Ideas',
              desc: 'Postula tu idea, obtén aprobación y desarrolla tu proyecto con seguimiento completo del equipo.',
            },
          ].map((f, i) => (
            <div
              key={f.titulo}
              className={`card p-7 hover:-translate-y-2 transition-all duration-300 cursor-default ${f.glow} animate-fade-up`}
              style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
            >
              <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mb-5`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{f.titulo}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          NOTICIAS — CARRUSEL
      ============================================================ */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-mmt-purple-50 text-mmt-purple flex items-center justify-center">
            <IconNewspaper className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Noticias del programa</h2>
            <p className="text-xs text-gray-400">Novedades y actividades de la cohorte 2026</p>
          </div>
        </div>

        {cargandoNoticias ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-mmt-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : noticias.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8 card p-6">
            No hay noticias publicadas aún.
          </p>
        ) : (
          <CarruselNoticias noticias={noticias} alAbrir={setNoticiaSeleccionada} />
        )}
      </section>

      {/* ============================================================
          CRONOGRAMA
      ============================================================ */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-mmt-celeste-50 text-mmt-celeste-dark flex items-center justify-center">
            <IconCalendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Cronograma MMT 2026</h2>
            <p className="text-xs text-gray-400">Hitos y actividades del programa</p>
          </div>
        </div>

        <div className="card p-6">
          <CronogramaTimeline conTareas />
        </div>
      </section>

      {/* ============================================================
          CTA FINAL
      ============================================================ */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-mmt-purple to-mmt-celeste-dark p-10 text-white text-center">
        <div className="absolute inset-0 animate-gradient opacity-50"
          style={{ background: 'linear-gradient(90deg, #6B21A8, #0ea5e9, #6B21A8)', backgroundSize: '200% 100%' }} />
        <div className="relative space-y-4">
          <img src={logoMMT} alt="MMT" className="w-16 h-16 rounded-full mx-auto object-cover ring-4 ring-white/30 animate-float" />
          <h2 className="text-2xl font-extrabold">¿Eres alumna MMT?</h2>
          <p className="text-white/70 text-sm max-w-xs mx-auto">
            Inicia sesión para acceder a todos los módulos del programa.
          </p>
        </div>
      </section>

      {/* Modal de noticia */}
      {noticiaSeleccionada && (
        <NoticiaModal
          noticia={noticiaSeleccionada}
          onCerrar={() => setNoticiaSeleccionada(null)}
        />
      )}

    </div>
  )
}
