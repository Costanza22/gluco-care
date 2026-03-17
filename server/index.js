import express from "express"
import cors from "cors"
import {
  getAllMeasurements,
  getMeasurementById,
  createMeasurement,
  updateMeasurement,
  deleteMeasurement,
  deleteAllMeasurements,
  getStats,
} from "./db.js"

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: true }))
app.use(express.json())

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "GlucoCare API" })
})

app.get("/api/measurements", (req, res) => {
  try {
    const list = getAllMeasurements()
    res.json(list)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Erro ao listar medições" })
  }
})

app.get("/api/measurements/stats", (req, res) => {
  try {
    const stats = getStats()
    res.json(stats)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Erro ao obter estatísticas" })
  }
})

app.get("/api/measurements/:id", (req, res) => {
  const m = getMeasurementById(req.params.id)
  if (!m) return res.status(404).json({ error: "Medição não encontrada" })
  res.json(m)
})

app.post("/api/measurements", (req, res) => {
  const { glucose, date, time, note } = req.body
  if (
    glucose == null ||
    typeof glucose !== "number" ||
    glucose < 20 ||
    glucose > 600 ||
    !date ||
    !time
  ) {
    return res.status(400).json({
      error: "Dados inválidos. Envie glucose (20-600), date e time.",
    })
  }
  try {
    const id = crypto.randomUUID()
    const created = createMeasurement({ id, glucose, date, time, note })
    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Erro ao criar medição" })
  }
})

app.patch("/api/measurements/:id", (req, res) => {
  const { id } = req.params
  const m = getMeasurementById(id)
  if (!m) return res.status(404).json({ error: "Medição não encontrada" })
  const { glucose, date, time, note } = req.body
  if (
    glucose != null && (typeof glucose !== "number" || glucose < 20 || glucose > 600)
  ) {
    return res.status(400).json({ error: "glucose deve ser entre 20 e 600" })
  }
  const payload = {
    glucose: glucose ?? m.glucose,
    date: date ?? m.date,
    time: time ?? m.time,
    note: note !== undefined ? note : m.note,
  }
  try {
    updateMeasurement(id, payload)
    res.json({ id, ...payload })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Erro ao atualizar medição" })
  }
})

app.delete("/api/measurements/:id", (req, res) => {
  const deleted = deleteMeasurement(req.params.id)
  if (!deleted) return res.status(404).json({ error: "Medição não encontrada" })
  res.status(204).send()
})

app.delete("/api/measurements", (req, res) => {
  try {
    deleteAllMeasurements()
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Erro ao limpar medições" })
  }
})

app.listen(PORT, () => {
  console.log(`GlucoCare API rodando em http://localhost:${PORT}`)
})
