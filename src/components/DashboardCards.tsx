import { useMemo } from "react"
import type { Measurement } from "../types/measurement"
import dayjs from "dayjs"

type Props = Readonly<{ measurements: Measurement[] }>

function lastMeasurement(measurements: Measurement[]): Measurement | null {
  if (measurements.length === 0) return null
  return [...measurements].sort(
    (a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime()
  )[0]
}

function averageLast7Days(measurements: Measurement[]): number | null {
  const cutoff = dayjs().subtract(7, "day").toISOString()
  const recent = measurements.filter((m) => `${m.date}T${m.time}` >= cutoff)
  if (recent.length === 0) return null
  const sum = recent.reduce((a, m) => a + m.glucose, 0)
  return Math.round(sum / recent.length)
}

function countToday(measurements: Measurement[]): number {
  const today = dayjs().format("YYYY-MM-DD")
  return measurements.filter((m) => m.date === today).length
}

function inTargetLast7(measurements: Measurement[]): { inTarget: number; total: number } {
  const cutoff = dayjs().subtract(7, "day").startOf("day").format("YYYY-MM-DD")
  const last7 = measurements.filter((m) => m.date >= cutoff)
  const inTarget = last7.filter((m) => m.glucose >= 70 && m.glucose <= 140).length
  return { inTarget, total: last7.length }
}

export default function DashboardCards({ measurements }: Props) {
  const last = useMemo(() => lastMeasurement(measurements), [measurements])
  const avg7 = useMemo(() => averageLast7Days(measurements), [measurements])
  const todayCount = useMemo(() => countToday(measurements), [measurements])
  const { inTarget, total } = useMemo(() => inTargetLast7(measurements), [measurements])

  return (
    <div className="dashboard-cards">
      <div className="dashboard-card dashboard-card--purple">
        <div className="dashboard-card__pattern" aria-hidden />
        <div className="dashboard-card__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <div className="dashboard-card__content">
          <span className="dashboard-card__label">Última medição</span>
          <span className="dashboard-card__value">
            {last ? `${last.glucose} mg/dL` : "—"}
          </span>
          <span className="dashboard-card__sub">
            {last ? dayjs(`${last.date}T${last.time}`).format("DD/MM [às] HH:mm") : "Nenhuma ainda"}
          </span>
        </div>
      </div>

      <div className="dashboard-card dashboard-card--purple2">
        <div className="dashboard-card__pattern" aria-hidden />
        <div className="dashboard-card__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M7 14l4-4 4 4 5-5" />
          </svg>
        </div>
        <div className="dashboard-card__content">
          <span className="dashboard-card__label">Média 7 dias</span>
          <span className="dashboard-card__value">
            {avg7 !== null ? `${avg7} mg/dL` : "—"}
          </span>
          <span className="dashboard-card__sub">
            {avg7 !== null ? "Últimos 7 dias" : "Sem dados"}
          </span>
        </div>
      </div>

      <div className="dashboard-card dashboard-card--yellow">
        <div className="dashboard-card__pattern" aria-hidden />
        <div className="dashboard-card__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </div>
        <div className="dashboard-card__content">
          <span className="dashboard-card__label">Hoje</span>
          <span className="dashboard-card__value">{todayCount}</span>
          <span className="dashboard-card__sub">
            {todayCount === 1 ? "medição" : "medições"}
          </span>
        </div>
      </div>

      <div className="dashboard-card dashboard-card--teal">
        <div className="dashboard-card__pattern" aria-hidden />
        <div className="dashboard-card__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
        </div>
        <div className="dashboard-card__content">
          <span className="dashboard-card__label">No alvo (7 dias)</span>
          <span className="dashboard-card__value">
            {total > 0 ? `${inTarget}/${total}` : "—"}
          </span>
          <span className="dashboard-card__sub">
            {total > 0 ? `${Math.round((inTarget / total) * 100)}% na meta` : "Sem dados"}
          </span>
        </div>
      </div>
    </div>
  )
}
