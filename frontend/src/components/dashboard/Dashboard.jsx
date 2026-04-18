import MilestoneTimeline from './MilestoneTimeline'
import RouteCard from './RouteCard'
import StatsBar from './StatsBar'

export default function Dashboard() {
  return (
    <div className="space-y-8">

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-mmt-purple to-mmt-celeste-dark p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-mmt-celeste/20 rounded-full translate-y-1/2" />
        <div className="relative">
          <p className="text-sm font-medium text-white/70 tracking-widest uppercase mb-1">Bienvenida al</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">MMT Valpo Hub</h1>
          <p className="text-white/80 text-base max-w-md">
            Tu espacio de gestión y aprendizaje — Programa MMT 2026, Duoc UC Valparaíso.
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Routes */}
      <section>
        <SectionTitle>Rutas de Desarrollo MMT</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <RouteCard
            title="Liderazgo"
            icon="⚡"
            color="purple"
            tasks={4}
            completed={2}
            description="Habilidades de liderazgo, comunicación y trabajo en equipo."
          />
          <RouteCard
            title="Vocación"
            icon="V"
            color="celeste"
            tasks={5}
            completed={1}
            description="Exploración de áreas tecnológicas, charlas y mentoría."
          />
          <RouteCard
            title="Proyectos"
            icon="P"
            color="mixed"
            tasks={6}
            completed={3}
            description="Desarrollo de proyectos aplicados con impacto real."
          />
        </div>
      </section>

      {/* Timeline */}
      <section>
        <SectionTitle>Cronograma de Hitos 2026</SectionTitle>
        <MilestoneTimeline />
      </section>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1 h-6 rounded-full bg-gradient-to-b from-mmt-purple to-mmt-celeste" />
      <h2 className="text-lg font-bold text-gray-800">{children}</h2>
    </div>
  )
}
