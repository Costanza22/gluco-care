import { useState, useEffect, useCallback } from "react"
import type { Measurement } from "./types/measurement"
import {
  fetchMeasurements,
  createMeasurement as apiCreate,
  updateMeasurement as apiUpdate,
  deleteMeasurement as apiDelete,
  deleteAllMeasurements as apiDeleteAll,
} from "./api"
import GlucoseChart from "./components/GlucoseChart"
import MeasureForm from "./components/MeasureForm"
import MeasureList from "./components/MeasureList"
import DashboardCards from "./components/DashboardCards"
import SummaryBlock from "./components/SummaryBlock"
import "./App.css"

const STORAGE_KEY = "glucose-monitor-measurements"

function loadFromStorage(): Measurement[] {
  try {
    if (globalThis.localStorage === undefined) return []
    const raw = globalThis.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(items: Measurement[]) {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

function App() {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    if (globalThis.document === undefined) return false
    return document.documentElement.classList.contains("dark-mode")
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<"7" | "30" | "all">("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchMeasurements()
      .then((data) => {
        setMeasurements(data)
        setBackendAvailable(true)
      })
      .catch(() => setMeasurements(loadFromStorage()))
      .finally(() => setInitialLoadDone(true))
  }, [])

  useEffect(() => {
    if (initialLoadDone && !backendAvailable) saveToStorage(measurements)
  }, [initialLoadDone, backendAvailable, measurements])

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add("dark-mode")
      try { globalThis.localStorage.setItem("glucose-monitor-theme", "dark") } catch { /* noop */ }
    } else {
      root.classList.remove("dark-mode")
      try { globalThis.localStorage.setItem("glucose-monitor-theme", "light") } catch { /* noop */ }
    }
  }, [darkMode])

  const submitMeasurement = useCallback(
    (m: Omit<Measurement, "id">, id?: string) => {
      setIsSubmitting(true)
      if (id) {
        apiUpdate(id, m)
          .then((updated) =>
            setMeasurements((prev) => prev.map((item) => (item.id === id ? updated : item)))
          )
          .catch(() => {
            setMeasurements((prev) =>
              prev.map((item) => (item.id === id ? { ...item, ...m } : item))
            )
            setBackendAvailable(false)
          })
          .finally(() => setIsSubmitting(false))
      } else if (backendAvailable) {
        apiCreate(m)
          .then((created) => setMeasurements((prev) => [...prev, created]))
          .catch(() => {
            setMeasurements((prev) => [...prev, { ...m, id: crypto.randomUUID() }])
            setBackendAvailable(false)
          })
          .finally(() => setIsSubmitting(false))
      } else {
        setMeasurements((prev) => [...prev, { ...m, id: crypto.randomUUID() }])
        setIsSubmitting(false)
      }
    },
    [backendAvailable]
  )

  const removeMeasurement = useCallback((id: string) => {
    if (backendAvailable) {
      apiDelete(id)
        .then(() => setMeasurements((prev) => prev.filter((item) => item.id !== id)))
        .catch(() => {
          setMeasurements((prev) => prev.filter((item) => item.id !== id))
          setBackendAvailable(false)
        })
    } else {
      setMeasurements((prev) => prev.filter((item) => item.id !== id))
    }
  }, [backendAvailable])

  const editingMeasurement = editingId
    ? measurements.find((m) => m.id === editingId) ?? null
    : null

  const exportBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify(measurements, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `glucocare-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [measurements])

  const restoreBackup = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const raw = reader.result as string
          const parsed = JSON.parse(raw) as unknown
          if (!Array.isArray(parsed)) throw new Error("Formato inválido")
          const list = parsed.filter(
            (x): x is Measurement =>
              x != null &&
              typeof x === "object" &&
              typeof (x as Measurement).id === "string" &&
              typeof (x as Measurement).glucose === "number" &&
              typeof (x as Measurement).date === "string" &&
              typeof (x as Measurement).time === "string"
          )
          if (list.length === 0) throw new Error("Nenhuma medição válida no arquivo")
          if (!window.confirm(`Restaurar ${list.length} medição(ões)? Os dados atuais serão substituídos.`))
            return
          if (backendAvailable) {
            apiDeleteAll()
              .then(() =>
                Promise.all(
                  list.map((m) =>
                    apiCreate({
                      glucose: m.glucose,
                      date: m.date,
                      time: m.time,
                      note: m.note,
                    })
                  )
                )
              )
              .then((created) => setMeasurements(created))
              .catch(() => {
                setMeasurements(list)
                setBackendAvailable(false)
              })
          } else {
            setMeasurements(list)
          }
        } catch (e) {
          window.alert(
            e instanceof Error ? e.message : "Arquivo inválido. Use um backup exportado pelo GlucoCare."
          )
        }
      }
      reader.readAsText(file)
    },
    [backendAvailable]
  )

  const exportCSV = useCallback(() => {
    const sorted = [...measurements].sort(
      (a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime()
    )
    const header = "Data,Hora,Glicose (mg/dL),Status,Observação"
    const status = (g: number) => (g < 70 ? "BAIXA" : g > 140 ? "ALTA" : "NORMAL")
    const escape = (s: string) => (s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s)
    const rows = sorted.map((m) =>
      [m.date, m.time, m.glucose, status(m.glucose), m.note ? escape(m.note) : ""].join(",")
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `glucocare-medições-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [measurements])

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
              <path d="M16 3C13.5 7 8 10.5 8 16a8 8 0 1 0 16 0c0-5.5-5.5-9-8-13z" fill="currentColor" fillOpacity="0.95"/>
            </svg>
          </span>
          <span className="sidebar__title">GlucoCare</span>
        </div>
        <nav className="sidebar__nav">
          <span className="sidebar__section">Menu</span>
          <a
            href="#dashboard"
            className="sidebar__link sidebar__link--active"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="sidebar__icon">▣</span>
            Dashboard
          </a>
          <a
            href="#historico"
            className="sidebar__link"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="sidebar__icon">≡</span>
            Histórico
          </a>
          <a
            href="#nova-medicao"
            className="sidebar__link"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="sidebar__icon">+</span>
            Nova medição
          </a>
          <span className="sidebar__section">App</span>
          <button
            type="button"
            className="sidebar__link"
            onClick={() => setDarkMode((d) => !d)}
          >
            <span className="sidebar__icon">{darkMode ? "☀" : "☽"}</span>
            {darkMode ? "Claro" : "Escuro"}
          </button>
        </nav>
      </aside>

      <div className="app-body">
        <header className="app-header">
          <button
            type="button"
            className="header-menu"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Abrir menu"
          >
            <span className="header-menu__bar" />
            <span className="header-menu__bar" />
            <span className="header-menu__bar" />
          </button>
          <div className="header-search">
            <span className="header-search__icon" aria-hidden>Q</span>
            <input
              type="search"
              className="header-search__input"
              placeholder="Buscar por data ou valor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar medições"
            />
          </div>
          {initialLoadDone && (
            <span className="header-status" title={backendAvailable ? "Dados no servidor" : "Dados apenas neste navegador"}>
              {backendAvailable ? "Conectado ao servidor" : "Dados locais"}
            </span>
          )}
        </header>

        <main className="app-main">
          {!initialLoadDone ? (
            <div className="app-loading" role="status" aria-live="polite">
              Carregando…
            </div>
          ) : (
            <>
          <section id="dashboard" className="app-main__anchor">
            <div className="dashboard-hero">
              <img
                src="https://plus.unsplash.com/premium_photo-1661771843714-fa40c226f43c?q=80&w=1470&auto=format&fit=crop"
                alt=""
                className="dashboard-hero__img"
                loading="lazy"
                decoding="async"
              />
            </div>
            <DashboardCards measurements={measurements} />
          </section>

          <section className="content-block content-block--summary">
            <h2 className="content-block__title">Resumo</h2>
            <SummaryBlock measurements={measurements} />
          </section>

          <section id="nova-medicao" className="content-block">
            <h2 className="content-block__title">
              {editingMeasurement ? "Editar medição" : "Nova medição"}
            </h2>
            <MeasureForm
              onSubmit={submitMeasurement}
              disabled={isSubmitting}
              editing={editingMeasurement}
              onCancelEdit={() => setEditingId(null)}
            />
          </section>

          <section className="content-block">
            <h2 className="content-block__title">Evolução</h2>
            <GlucoseChart measurements={measurements} />
          </section>

          <section id="historico" className="content-block">
            <div className="content-block__head">
              <h2 className="content-block__title">Histórico de medições</h2>
              <div className="content-block__actions">
                <button
                  type="button"
                  className="content-block__export"
                  onClick={exportCSV}
                  disabled={measurements.length === 0}
                >
                  Exportar CSV
                </button>
                <button
                  type="button"
                  className="content-block__export"
                  onClick={exportBackup}
                  disabled={measurements.length === 0}
                >
                  Backup JSON
                </button>
                <label className="content-block__restore">
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) restoreBackup(f)
                      e.target.value = ""
                    }}
                    className="content-block__restore-input"
                  />
                  Restaurar
                </label>
              </div>
            </div>
            <MeasureList
              measurements={measurements}
              onRemove={removeMeasurement}
              onEdit={(m) => {
                setEditingId(m.id)
                document.getElementById("nova-medicao")?.scrollIntoView({ behavior: "smooth" })
              }}
              searchQuery={searchQuery}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </section>
            </>
          )}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
    </div>
  )
}

export default App
