import GlucoseChart from "../components/GlucoseChart"
import type { Measurement } from "../types/measurement"

type Props = Readonly<{ measurements: Measurement[] }>

export default function Dashboard({ measurements }: Props) {
  return (
    <section aria-labelledby="dashboard-title">
      <h1 id="dashboard-title">Dashboard</h1>
      <GlucoseChart measurements={measurements} />
    </section>
  )
}
