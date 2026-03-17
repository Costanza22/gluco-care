import { useMemo } from "react"
import type { Measurement } from "../types/measurement"
import dayjs from "dayjs"

const TARGET_MIN = 70
const TARGET_MAX = 140

type Props = Readonly<{ measurements: Measurement[] }>

function inRange(glucose: number): boolean {
  return glucose >= TARGET_MIN && glucose <= TARGET_MAX
}

export default function SummaryBlock({ measurements }: Props) {
  const last7 = useMemo(() => {
    const cutoff = dayjs().subtract(7, "day").startOf("day").format("YYYY-MM-DD")
    return measurements.filter((m) => m.date >= cutoff)
  }, [measurements])

  const inTarget = useMemo(() => last7.filter((m) => inRange(m.glucose)).length, [last7])
  const total = last7.length
  const pct = total > 0 ? Math.round((inTarget / total) * 100) : null

  const minMax7 = useMemo(() => {
    if (last7.length === 0) return null
    const values = last7.map((m) => m.glucose)
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [last7])

  const trend = useMemo(() => {
    const sorted = [...measurements].sort(
      (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
    )
    const last5 = sorted.slice(-5)
    if (last5.length < 2) return null
    const first = last5[0].glucose
    const last = last5[last5.length - 1].glucose
    const diff = last - first
    if (diff >= 15) return { label: "Subindo", type: "up" }
    if (diff <= -15) return { label: "Descendo", type: "down" }
    return { label: "Estável", type: "stable" }
  }, [measurements])

  return (
    <div className="summary-block">
      <p className="summary-block__meta">
        Sua meta: manter entre <strong>{TARGET_MIN} e {TARGET_MAX} mg/dL</strong>
      </p>
      <div className="summary-block__stats">
        <span className="summary-block__stat">
          No alvo (últimos 7 dias): <strong>{inTarget}</strong> de <strong>{total}</strong>
          {total === 1 ? " medição" : " medições"}
          {pct !== null && (
            <span className="summary-block__pct"> ({pct}%)</span>
          )}
        </span>
        {trend && (
          <span className={`summary-block__trend summary-block__trend--${trend.type}`}>
            Tendência: {trend.label}
          </span>
        )}
        {minMax7 && (
          <span className="summary-block__stat">
            Mín/Máx (7 dias): <strong>{minMax7.min}</strong> – <strong>{minMax7.max}</strong> mg/dL
          </span>
        )}
      </div>
    </div>
  )
}
