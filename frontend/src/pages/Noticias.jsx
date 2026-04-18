/*
 * pages/Noticias.jsx — Feed de noticias del programa MMT
 * Accesible para todos los usuarios (con y sin sesion).
 * Si hay sesión activa el filtro de sede se inicializa con la sede del usuario.
 */

import { useState, useEffect } from 'react'
import { apiFetch }  from '../hooks/useApi'
import { useSesion } from '../context/SesionContext'
import NoticiaCard        from '../components/noticias/NoticiaCard'
import NoticiaModal       from '../components/noticias/NoticiaModal'
import CarruselNoticias   from '../components/noticias/CarruselNoticias'

export default function Noticias() {
  const { alumna }  = useSesion()

  const [noticias,     setNoticias]     = useState([])
  const [sedes,        setSedes]        = useState([])
  const [sedeFiltro,   setSedeFiltro]   = useState('')   // '' = todas
  const [cargando,     setCargando]     = useState(true)
  const [error,        setError]        = useState(null)
  const [seleccionada, setSeleccionada] = useState(null)

  // Cargar sedes activas para el selector
  useEffect(() => {
    apiFetch('/api/sedes')
      .then(j => setSedes(j.sedes ?? []))
      .catch(() => {})
  }, [])

  // Cuando se conoce la alumna logueada, pre-seleccionar su sede
  useEffect(() => {
    if (alumna?.id_sede) {
      setSedeFiltro(String(alumna.id_sede))
    }
  }, [alumna])

  // Cargar noticias cuando cambia el filtro
  useEffect(() => {
    setCargando(true)
    setError(null)
    const url = sedeFiltro ? `/api/noticias?sede=${sedeFiltro}` : '/api/noticias'
    apiFetch(url)
      .then(j => setNoticias(j.noticias ?? []))
      .catch(err => setError(err.message))
      .finally(() => setCargando(false))
  }, [sedeFiltro])

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Noticias del programa</h1>
          <p className="text-sm text-gray-500 mt-0.5">Novedades y actividades de la cohorte MMT 2026</p>
        </div>

        {/* Filtro de sede — visible si hay sedes cargadas */}
        {sedes.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Sede</label>
            <select
              value={sedeFiltro}
              onChange={e => setSedeFiltro(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-mmt-purple/30"
            >
              <option value="">Todas las sedes</option>
              {sedes.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {cargando && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-mmt-purple border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="card p-6 text-center text-red-500 text-sm">{error}</div>
      )}

      {!cargando && !error && noticias.length === 0 && (
        <div className="card p-10 text-center text-gray-400 text-sm">
          No hay noticias publicadas{sedeFiltro ? ' para esta sede' : ''}.
        </div>
      )}

      {!cargando && !error && noticias.length > 0 && (
        <div className="space-y-6">
          {/* Carrusel principal */}
          <CarruselNoticias noticias={noticias} alAbrir={setSeleccionada} />

          {/* Grid de cards debajo para navegación rápida */}
          {noticias.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {noticias.map(n => (
                <NoticiaCard key={n.id} noticia={n} alAbrir={setSeleccionada} />
              ))}
            </div>
          )}
        </div>
      )}

      {seleccionada && (
        <NoticiaModal noticia={seleccionada} onCerrar={() => setSeleccionada(null)} />
      )}
    </div>
  )
}
