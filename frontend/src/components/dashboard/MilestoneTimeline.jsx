/*
 * components/dashboard/MilestoneTimeline.jsx
 * Cronograma del dashboard — usa el mismo componente y datos que la landing page.
 */

import CronogramaTimeline from '../ui/CronogramaTimeline'
import { useSesion }      from '../../context/SesionContext'

export default function MilestoneTimeline() {
  const { alumna } = useSesion()
  return (
    <div className="card p-5">
      <CronogramaTimeline conTareas={!!alumna} />
    </div>
  )
}
