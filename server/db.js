import Database from "better-sqlite3"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, "glucocare.db")
const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS measurements (
    id TEXT PRIMARY KEY,
    glucose REAL NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_measurements_date ON measurements(date);
  CREATE INDEX IF NOT EXISTS idx_measurements_created ON measurements(created_at);
`)
try {
  db.exec("ALTER TABLE measurements ADD COLUMN note TEXT")
} catch {
  // column already exists
}


export function getAllMeasurements() {
  const stmt = db.prepare(
    "SELECT id, glucose, date, time, note FROM measurements ORDER BY date DESC, time DESC"
  )
  return stmt.all().map((row) => ({
    id: row.id,
    glucose: row.glucose,
    date: row.date,
    time: row.time,
    note: row.note || undefined,
  }))
}

export function getMeasurementById(id) {
  const stmt = db.prepare("SELECT id, glucose, date, time, note FROM measurements WHERE id = ?")
  const row = stmt.get(id)
  if (!row) return null
  return { ...row, note: row.note || undefined }
}

export function createMeasurement({ id, glucose, date, time, note }) {
  const stmt = db.prepare(
    "INSERT INTO measurements (id, glucose, date, time, note) VALUES (?, ?, ?, ?, ?)"
  )
  stmt.run(id, glucose, date, time, note || null)
  return { id, glucose, date, time, note: note || undefined }
}

export function updateMeasurement(id, { glucose, date, time, note }) {
  const stmt = db.prepare(
    "UPDATE measurements SET glucose = ?, date = ?, time = ?, note = ? WHERE id = ?"
  )
  const result = stmt.run(glucose, date, time, note ?? null, id)
  return result.changes > 0
}

export function deleteMeasurement(id) {
  const stmt = db.prepare("DELETE FROM measurements WHERE id = ?")
  const result = stmt.run(id)
  return result.changes > 0
}

export function deleteAllMeasurements() {
  const stmt = db.prepare("DELETE FROM measurements")
  stmt.run()
}

export function getStats() {
  const today = new Date().toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const last = db
    .prepare(
      "SELECT id, glucose, date, time FROM measurements ORDER BY date DESC, time DESC LIMIT 1"
    )
    .get()

  const last7 = db
    .prepare(
      "SELECT glucose FROM measurements WHERE date >= ? ORDER BY date, time"
    )
    .all(sevenDaysAgo)

  const todayCount = db
    .prepare("SELECT COUNT(*) as n FROM measurements WHERE date = ?")
    .get(today)

  const inTarget = last7.filter((r) => r.glucose >= 70 && r.glucose <= 140).length
  const avg7 =
    last7.length > 0
      ? Math.round(last7.reduce((a, r) => a + r.glucose, 0) / last7.length)
      : null

  return {
    last: last
      ? {
          id: last.id,
          glucose: last.glucose,
          date: last.date,
          time: last.time,
        }
      : null,
    avg7,
    todayCount: todayCount?.n ?? 0,
    inTargetLast7: { inTarget, total: last7.length },
  }
}

export default db
