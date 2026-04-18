/*
 * pages/Home.jsx — Wrapper inteligente para la ruta "/"
 * Muestra Landing si no hay sesión, Dashboard si está autenticada.
 */

import { useSesion }  from '../context/SesionContext'
import Dashboard      from '../components/dashboard/Dashboard'
import Landing        from './Landing'

export default function Home() {
  const { alumna, cargando } = useSesion()

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-mmt-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return alumna ? <Dashboard /> : <Landing />
}
