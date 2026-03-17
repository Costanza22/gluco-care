import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts"
import type { Measurement } from "../types/measurement"
import dayjs from "dayjs"

type Props = Readonly<{ measurements: Measurement[] }>

export default function GlucoseChart({ measurements }: Props) {
  const chartData = useMemo(() => {
    const sorted = [...measurements].sort(
      (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
    )
    return sorted.map((m) => ({
      time: dayjs(`${m.date}T${m.time}`).format("DD/MM HH:mm"),
      glucose: m.glucose,
      full: `${m.glucose} mg/dL`,
    }))
  }, [measurements])

  if (chartData.length === 0) {
    return (
      <output className="chart-empty" role="status" aria-live="polite">
        <p>Nenhuma medição para exibir.</p>
        <p>Registre uma medição acima para ver o gráfico.</p>
      </output>
    )
  }

  const domain: [number, number] = [
    Math.max(0, Math.min(...chartData.map((d) => d.glucose)) - 20),
    Math.max(200, Math.max(...chartData.map((d) => d.glucose)) + 20),
  ]

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 12, right: 16, left: 52, bottom: 32 }}
          aria-label="Gráfico de glicose ao longo do tempo"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <ReferenceArea
            y1={70}
            y2={140}
            fill="var(--accent)"
            fillOpacity={0.08}
            strokeOpacity={0}
          />
          <XAxis
            dataKey="time"
            tick={{ fill: "var(--text)", fontSize: 11 }}
            stroke="var(--border)"
            tickMargin={10}
          />
          <YAxis
            domain={domain}
            tick={{ fill: "var(--text)", fontSize: 11 }}
            stroke="var(--border)"
            unit=" mg/dL"
            width={48}
            tickMargin={8}
          />
          <Tooltip
            contentStyle={{
              background: "var(--row)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
            }}
            labelStyle={{ color: "var(--text)" }}
            formatter={(value) => (value != null ? [`${value} mg/dL`, "Glicose"] : null)}
            labelFormatter={(label) => label}
          />
          <Line
            type="monotone"
            dataKey="glucose"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ fill: "var(--accent)", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "var(--row)", stroke: "var(--accent)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
