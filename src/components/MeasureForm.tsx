import { useState, useEffect, type FormEvent } from "react"
import type { Measurement } from "../types/measurement"

type Props = Readonly<{
  onSubmit: (m: Omit<Measurement, "id">, id?: string) => void
  disabled?: boolean
  editing?: Measurement | null
  onCancelEdit?: () => void
}>

export default function MeasureForm({
  onSubmit,
  disabled = false,
  editing = null,
  onCancelEdit,
}: Props) {
  const [glucose, setGlucose] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState(() => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  })
  const [note, setNote] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (editing) {
      setGlucose(String(editing.glucose))
      setDate(editing.date)
      setTime(editing.time)
      setNote(editing.note ?? "")
    } else {
      setGlucose("")
      setDate(new Date().toISOString().slice(0, 10))
      setTime(
        `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`
      )
      setNote("")
    }
    setError("")
  }, [editing])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const value = Number(glucose.trim().replace(",", "."))
    if (glucose.trim() === "" || Number.isNaN(value)) {
      setError("Informe um valor numérico.")
      return
    }
    if (value < 20 || value > 600) {
      setError("Valor entre 20 e 600 mg/dL.")
      return
    }
    const payload = { glucose: value, date, time, note: note.trim() || undefined }
    if (editing) {
      onSubmit(payload, editing.id)
      onCancelEdit?.()
    } else {
      onSubmit(payload)
      setGlucose("")
      setNote("")
      setDate(new Date().toISOString().slice(0, 10))
      setTime(
        `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`
      )
    }
    setError("")
  }

  return (
    <form onSubmit={handleSubmit} className="measure-form">
      <div className="measure-form-row measure-form-row--glucose">
        <label htmlFor="glucose">Glicose</label>
        <input
          id="glucose"
          type="text"
          inputMode="decimal"
          placeholder="ex: 95"
          value={glucose}
          onChange={(e) => setGlucose(e.target.value)}
          aria-describedby="glucose-hint"
        />
        <span id="glucose-hint" className="hint">mg/dL</span>
      </div>
      <div className="measure-form-row measure-form-row--date">
        <label htmlFor="date">Data</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="measure-form-row measure-form-row--time">
        <label htmlFor="time">Hora</label>
        <input
          id="time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>
      <div className="measure-form-row measure-form-row--note">
        <label htmlFor="note">Observação (opcional)</label>
        <input
          id="note"
          type="text"
          placeholder="ex: em jejum, após café"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="measure-form-actions">
        <button type="submit" className="measure-form-submit" disabled={disabled}>
          {disabled ? (editing ? "Atualizando…" : "Adicionando…") : editing ? "Atualizar" : "Adicionar"}
        </button>
        {editing && onCancelEdit && (
          <button type="button" className="measure-form-cancel" onClick={onCancelEdit}>
            Cancelar
          </button>
        )}
      </div>
      {error && <span className="measure-form-error" role="alert">{error}</span>}
    </form>
  )
}
