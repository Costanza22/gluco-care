import MeasureList from "../components/MeasureList"
import type { Measurement } from "../types/measurement"

type Props = Readonly<{
  measurements: Measurement[]
  onRemove: (id: string) => void
}>

export default function History({ measurements, onRemove }: Props) {
  return (
    <section aria-labelledby="history-title">
      <h1 id="history-title">Histórico</h1>
      <p className="page-desc">Medições registradas (mais recentes primeiro).</p>
      <MeasureList measurements={measurements} onRemove={onRemove} />
    </section>
  )
}
