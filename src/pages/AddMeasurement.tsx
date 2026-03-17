import MeasureForm from "../components/MeasureForm"
import type { Measurement } from "../types/measurement"

type Props = Readonly<{ onAdd: (m: Omit<Measurement, "id">) => void }>

export default function AddMeasurement({ onAdd }: Props) {
  return (
    <section aria-labelledby="add-title">
      <h1 id="add-title">Nova medição</h1>
      <p className="page-desc">Registre o valor da glicose, data e horário.</p>
      <MeasureForm onSubmit={onAdd} />
    </section>
  )
}
