"use client"

import { useState, useEffect } from "react"

const C = {
  card: "#13161f",
  border: "#1e2535",
  text: "#f1f5f9",
  muted: "#94a3b8",
  dim: "#475569",
  blue: "#3b82f6",
}

type Row = {
  statisticalPeriod: string
  pvYield: number
  inverterYield: number
  export: number
  import: number
  revenue: number
}

const COLUMNS: { label: string; key: keyof Row; unit: string }[] = [
  { label: "Статистичний період", key: "statisticalPeriod", unit: "" },
  { label: "Вироблення PV",       key: "pvYield",           unit: "кВт·год" },
  { label: "Вироблення інвертора",key: "inverterYield",     unit: "кВт·год" },
  { label: "Експорт",             key: "export",            unit: "кВт·год" },
  { label: "Імпорт",              key: "import",            unit: "кВт·год" },
  { label: "Дохід",               key: "revenue",           unit: "₪" },
]

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function cellColor(key: keyof Row): string {
  if (key === "pvYield" || key === "inverterYield") return "#22c55e"
  if (key === "export") return C.blue
  if (key === "import") return "#f97316"
  if (key === "revenue") return "#a855f7"
  return C.muted
}

export function InverterTable() {
  const [date, setDate] = useState<string>(toDateInput(new Date()))
  const [records, setRecords] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/inverter/records?date=${date}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setRecords(data); setLoading(false) } })
    return () => { cancelled = true }
  }, [date])

  const isEmpty = !loading && records.length === 0

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <label style={{ fontSize: "13px", color: C.muted }}>Дата:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px",
            padding: "8px 12px", color: C.text, fontSize: "13px", outline: "none",
            colorScheme: "dark",
          }}
        />
        <span style={{ fontSize: "12px", color: C.dim, marginLeft: "auto" }}>
          Погодинні дані · 24 записи
        </span>
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {COLUMNS.map(({ label, unit }) => (
                  <th key={label} style={{
                    padding: "11px 14px", textAlign: "left", color: C.dim,
                    fontWeight: 500, whiteSpace: "nowrap", background: "#0f1117",
                  }}>
                    {label}
                    {unit && <span style={{ color: "#334155", fontSize: "10px", display: "block" }}>{unit}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ padding: "48px", textAlign: "center", color: C.dim }}>
                    Завантаження...
                  </td>
                </tr>
              ) : isEmpty ? (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ padding: "48px", textAlign: "center", color: C.dim }}>
                    Немає даних за цю дату
                  </td>
                </tr>
              ) : (
                records.map((rec, idx) => {
                  const isNight = rec.pvYield === 0
                  return (
                    <tr
                      key={idx}
                      style={{ borderBottom: `1px solid ${C.border}`, opacity: isNight ? 0.5 : 1 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {COLUMNS.map(({ key }) => {
                        const isNum = key !== "statisticalPeriod"
                        const raw = rec[key]
                        return (
                          <td key={key} style={{
                            padding: "10px 14px",
                            color: isNum ? cellColor(key) : C.text,
                            fontFamily: isNum ? "monospace" : "inherit",
                            whiteSpace: "nowrap",
                          }}>
                            {isNum ? Number(raw).toFixed(3) : String(raw)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && !isEmpty && (
          <div style={{ padding: "11px 14px", borderTop: `1px solid ${C.border}`, color: C.dim, fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
            <span>{records.length} записів · погодинна статистика</span>
            <span>
              PV: <span style={{ color: "#22c55e" }}>{records.reduce((s, r) => s + r.pvYield, 0).toFixed(2)} кВт·год</span>
              {" "}· Імпорт: <span style={{ color: "#f97316" }}>{records.reduce((s, r) => s + r.import, 0).toFixed(2)} кВт·год</span>
              {" "}· Дохід: <span style={{ color: "#a855f7" }}>{records.reduce((s, r) => s + r.revenue, 0).toFixed(2)} ₪</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
