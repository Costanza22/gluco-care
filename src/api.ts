import type { Measurement } from "./types/measurement"

const API_BASE = ""

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || "Erro na API")
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export async function fetchMeasurements(): Promise<Measurement[]> {
  return request<Measurement[]>("/api/measurements")
}

export async function createMeasurement(
  body: Omit<Measurement, "id">
): Promise<Measurement> {
  return request<Measurement>("/api/measurements", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function updateMeasurement(
  id: string,
  body: Partial<Omit<Measurement, "id">>
): Promise<Measurement> {
  return request<Measurement>(`/api/measurements/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function deleteMeasurement(id: string): Promise<void> {
  return request(`/api/measurements/${id}`, { method: "DELETE" })
}

export async function deleteAllMeasurements(): Promise<void> {
  return request("/api/measurements", { method: "DELETE" })
}

export type Stats = {
  last: Measurement | null
  avg7: number | null
  todayCount: number
  inTargetLast7: { inTarget: number; total: number }
}

export async function fetchStats(): Promise<Stats> {
  return request<Stats>("/api/measurements/stats")
}
