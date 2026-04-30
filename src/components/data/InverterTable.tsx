"use client"

import { useState, useEffect } from "react"

const C = {
  card:   "var(--c-card)",
  border: "var(--c-border)",
  text:   "var(--c-text)",
  muted:  "var(--c-muted)",
  dim:    "var(--c-dim)",
  blue:   "#3b82f6",
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return isMobile
}

export function InverterTable() {
  const [date, setDate] = useState<string>(toDateInput(new Date()))
  const [records, setRecords] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/inverter/records?date=${date}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setRecords(data); setLoading(false) } })
    return () => { cancelled = true }
  }, [date])

  const isEmpty = !loading && records.length === 0

  const numFontSize = isMobile ? "13px" : "16px"
  const periodFontSize = isMobile ? "13px" : "15px"
  const cellPadding = isMobile ? "12px 14px" : "16px 24px"
  const headPadding = isMobile ? "12px 14px" : "14px 24px"

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
            colorScheme: "light dark",
          }}
        />
        <span style={{ fontSize: "12px", color: C.dim, marginLeft: "auto" }}>
          Погодинні дані · 24 записи
        </span>
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {COLUMNS.map(({ label, unit, key }) => {
                  const isSticky = key === "statisticalPeriod"
                  return (
                    <th key={label} style={{
                      padding: headPadding, textAlign: "left", color: C.muted,
                      fontWeight: 600, whiteSpace: "nowrap", background: "var(--c-thead)",
                      fontSize: "11px", letterSpacing: "0.6px", textTransform: "uppercase",
                      ...(isSticky ? {
                        position: "sticky", left: 0, zIndex: 2,
                        boxShadow: "2px 0 6px rgba(0,0,0,0.15)",
                      } : {}),
                    }}>
                      {label}
                      {unit && <span style={{ color: C.dim, fontSize: "11px", display: "block", fontWeight: 400, textTransform: "none", letterSpacing: 0, marginTop: "2px" }}>{unit}</span>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ padding: "64px", textAlign: "center", color: C.dim, fontSize: "15px" }}>
                    Завантаження...
                  </td>
                </tr>
              ) : isEmpty ? (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ padding: "64px", textAlign: "center", color: C.dim, fontSize: "15px" }}>
                    Немає даних за цю дату
                  </td>
                </tr>
              ) : (
                records.map((rec, idx) => {
                  const isNight = rec.pvYield === 0
                  return (
                    <tr
                      key={idx}
                      style={{ borderBottom: `1px solid ${C.border}`, opacity: isNight ? 0.4 : 1 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34,197,94,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {COLUMNS.map(({ key }) => {
                        const isNum = key !== "statisticalPeriod"
                        const isSticky = key === "statisticalPeriod"
                        const raw = rec[key]
                        return (
                          <td key={key} style={{
                            padding: cellPadding,
                            color: isNum ? cellColor(key) : C.text,
                            fontFamily: isNum ? "'Geist Mono', monospace" : "inherit",
                            fontWeight: isNum ? 600 : 500,
                            fontSize: isNum ? numFontSize : periodFontSize,
                            whiteSpace: "nowrap",
                            letterSpacing: isNum ? "-0.3px" : "inherit",
                            ...(isSticky ? {
                              position: "sticky", left: 0,
                              background: "var(--c-card)",
                              boxShadow: "2px 0 6px rgba(0,0,0,0.1)",
                              zIndex: 1,
                            } : {}),
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
          <div style={{ padding: "13px 20px", borderTop: `1px solid ${C.border}`, color: C.dim, fontSize: "13px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
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
