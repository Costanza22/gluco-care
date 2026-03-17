import type { Measurement } from "../types/measurement"
import dayjs from "dayjs"
import "dayjs/locale/pt-br"

dayjs.locale("pt-br")

type DateRange = "7" | "30" | "all"

type Props = Readonly<{
  measurements: Measurement[]
  onRemove: (id: string) => void
  onEdit?: (m: Measurement) => void
  searchQuery?: string
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange) => void
}>

function formatDateShort(date: string) {
  return dayjs(date).format("DD MMM, YYYY")
}

function glucoseStatus(glucose: number): "low" | "ok" | "high" {
  if (glucose < 70) return "low"
  if (glucose > 140) return "high"
  return "ok"
}

const STATUS_LABEL = { low: "BAIXA", ok: "NORMAL", high: "ALTA" } as const

function matchesSearch(m: Measurement, q: string): boolean {
  if (!q.trim()) return true
  const lower = q.toLowerCase()
  const dateStr = dayjs(m.date).format("DD/MM/YYYY")
  return (
    String(m.glucose).includes(lower) ||
    m.date.includes(lower) ||
    m.time.includes(lower) ||
    dateStr.includes(lower) ||
    (m.note ? m.note.toLowerCase().includes(lower) : false)
  )
}

function filterByDateRange(measurements: Measurement[], range: DateRange): Measurement[] {
  if (range === "all") return measurements
  const days = range === "7" ? 7 : 30
  const cutoff = dayjs().subtract(days, "day").startOf("day").format("YYYY-MM-DD")
  return measurements.filter((m) => m.date >= cutoff)
}

export default function MeasureList({
  measurements,
  onRemove,
  onEdit,
  searchQuery = "",
  dateRange = "all",
  onDateRangeChange,
}: Props) {
  const byDate = filterByDateRange(measurements, dateRange)
  const sorted = [...byDate].sort(
    (a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime()
  )
  const filtered = searchQuery.trim() ? sorted.filter((m) => matchesSearch(m, searchQuery)) : sorted

  if (filtered.length === 0) {
    return (
      <div className="measure-list-root">
        {onDateRangeChange && (
          <div className="measure-list-filters">
            <button
              type="button"
              className={`filter-btn ${dateRange === "7" ? "filter-btn--active" : ""}`}
              onClick={() => onDateRangeChange("7")}
            >
              7 dias
            </button>
            <button
              type="button"
              className={`filter-btn ${dateRange === "30" ? "filter-btn--active" : ""}`}
              onClick={() => onDateRangeChange("30")}
            >
              30 dias
            </button>
            <button
              type="button"
              className={`filter-btn ${dateRange === "all" ? "filter-btn--active" : ""}`}
              onClick={() => onDateRangeChange("all")}
            >
              Todas
            </button>
          </div>
        )}
        <div className="measure-list-empty" role="status">
          {measurements.length === 0
            ? "Nenhuma medição. Adicione uma nova acima."
            : "Nenhum resultado para o período ou busca."}
        </div>
      </div>
    )
  }

  return (
    <div className="measure-list-root">
      {onDateRangeChange && (
        <div className="measure-list-filters">
          <button
            type="button"
            className={`filter-btn ${dateRange === "7" ? "filter-btn--active" : ""}`}
            onClick={() => onDateRangeChange("7")}
          >
            7 dias
          </button>
          <button
            type="button"
            className={`filter-btn ${dateRange === "30" ? "filter-btn--active" : ""}`}
            onClick={() => onDateRangeChange("30")}
          >
            30 dias
          </button>
          <button
            type="button"
            className={`filter-btn ${dateRange === "all" ? "filter-btn--active" : ""}`}
            onClick={() => onDateRangeChange("all")}
          >
            Todas
          </button>
        </div>
      )}
      <div className="measure-table-wrap">
        <table className="measure-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Hora</th>
              <th>Glicose</th>
              <th>Status</th>
              <th>Observação</th>
              <th className="cell-action" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const status = glucoseStatus(m.glucose)
              return (
                <tr key={m.id}>
                  <td className="cell-datetime">{formatDateShort(m.date)}</td>
                  <td className="cell-time">{m.time}</td>
                  <td className="cell-value-num">{m.glucose} mg/dL</td>
                  <td>
                    <span className={`pill pill--${status}`}>{STATUS_LABEL[status]}</span>
                  </td>
                  <td className="cell-note">{m.note || "—"}</td>
                  <td className="cell-action">
                    {onEdit && (
                      <button
                        type="button"
                        className="measure-list-edit"
                        onClick={() => onEdit(m)}
                        aria-label={`Editar ${m.glucose} mg/dL`}
                      >
                        Editar
                      </button>
                    )}
                    <button
                      type="button"
                      className="measure-list-remove"
                      onClick={() => {
                        if (window.confirm("Excluir esta medição?")) onRemove(m.id)
                      }}
                      aria-label={`Excluir ${m.glucose} mg/dL`}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
