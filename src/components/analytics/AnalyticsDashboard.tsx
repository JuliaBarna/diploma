"use client"

import { useState, useEffect } from "react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"

const C = {
  card:   "var(--c-card)",
  border: "var(--c-border)",
  text:   "var(--c-text)",
  muted:  "var(--c-muted)",
  dim:    "var(--c-dim)",
  green:  "#22c55e",
  blue:   "#3b82f6",
  orange: "#f97316",
  yellow: "#eab308",
}

type Mode = "day" | "week" | "month"

interface HourRecord {
  statisticalPeriod: string
  pvYield: number
  export: number
  import: number
  revenue: number
}

interface DayRow {
  date: string
  day: string
  pvYield: number
  export: number
  import: number
  revenue: number
}

function toDateInput(d: Date)  { return d.toISOString().slice(0, 10) }
function toMonthInput(d: Date) { return d.toISOString().slice(0, 7) }
function toWeekInput(d: Date) {
  const day = d.getUTCDay() || 7
  const mon = new Date(d)
  mon.setUTCDate(d.getUTCDate() - day + 1)
  const y = mon.getUTCFullYear()
  const w = Math.ceil(((mon.getTime() - new Date(Date.UTC(y, 0, 1)).getTime()) / 86400000 + 1) / 7)
  return `${y}-W${String(w).padStart(2, "0")}`
}

function weekRange(week: string): { from: string; to: string } {
  const [y, w] = week.split("-W").map(Number)
  const jan1 = new Date(Date.UTC(y, 0, 1))
  const mon = new Date(jan1.getTime() + (w - 1) * 7 * 86400000 - (jan1.getUTCDay() || 7) * 86400000 + 86400000)
  const sun = new Date(mon.getTime() + 6 * 86400000)
  return { from: toDateInput(mon), to: toDateInput(sun) }
}

function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number)
  const from = `${month}-01`
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const to = `${month}-${String(lastDay).padStart(2, "0")}`
  return { from, to }
}

const tooltipStyle = {
  contentStyle: { background: "var(--c-bg)", border: "1px solid var(--c-border)", borderRadius: "8px", fontSize: "12px" },
  labelStyle: { color: "var(--c-muted)" },
  itemStyle: { color: "var(--c-text)" },
}

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const check = () => setM(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return m
}

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
      borderRadius: "6px", border: "none",
      background: active ? C.orange : "transparent",
      color: active ? "#fff" : C.muted,
      transition: "all 0.15s",
    }}>{children}</button>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: C.text, marginBottom: "16px" }}>{title}</div>
      {children}
    </div>
  )
}

function Summary({ records }: { records: { pvYield: number; import: number; revenue: number }[] }) {
  const pv  = records.reduce((s, r) => s + r.pvYield, 0)
  const imp = records.reduce((s, r) => s + r.import,  0)
  const rev = records.reduce((s, r) => s + r.revenue, 0)
  return (
    <span style={{ fontSize: "12px", color: C.dim, marginLeft: "auto" }}>
      PV: <span style={{ color: C.green }}>{pv.toFixed(2)} кВт·год</span>
      {" "}· Імпорт: <span style={{ color: C.orange }}>{imp.toFixed(2)} кВт·год</span>
      {" "}· Дохід: <span style={{ color: C.yellow }}>{rev.toFixed(2)} ₪</span>
    </span>
  )
}

export function AnalyticsDashboard() {
  const [mode, setMode] = useState<Mode>("day")
  const [date,  setDate]  = useState(toDateInput(new Date()))
  const [week,  setWeek]  = useState(toWeekInput(new Date()))
  const [month, setMonth] = useState(toMonthInput(new Date()))

  const [hourRecords, setHourRecords] = useState<HourRecord[]>([])
  const [dayRows,     setDayRows]     = useState<DayRow[]>([])
  const [loading, setLoading] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    if (mode === "day") {
      fetch(`/api/inverter/records?date=${date}`)
        .then(r => r.json())
        .then(data => { if (!cancelled) { setHourRecords(data); setLoading(false) } })
    } else {
      const { from, to } = mode === "week" ? weekRange(week) : monthRange(month)
      fetch(`/api/analytics/range?from=${from}&to=${to}`)
        .then(r => r.json())
        .then(data => { if (!cancelled) { setDayRows(data); setLoading(false) } })
    }

    return () => { cancelled = true }
  }, [mode, date, week, month])

  const records = mode === "day" ? hourRecords : dayRows
  const isEmpty = !loading && records.length === 0
  const xKey    = mode === "day" ? "statisticalPeriod" : "day"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "4px", background: "var(--c-bg)", borderRadius: "8px", padding: "3px" }}>
          <ModeBtn active={mode === "day"}   onClick={() => setMode("day")}>День</ModeBtn>
          <ModeBtn active={mode === "week"}  onClick={() => setMode("week")}>Тиждень</ModeBtn>
          <ModeBtn active={mode === "month"} onClick={() => setMode("month")}>Місяць</ModeBtn>
        </div>

        {mode === "day" && (
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "8px 12px", color: C.text, fontSize: "13px", outline: "none", colorScheme: "light dark" }} />
        )}
        {mode === "week" && (
          <input type="week" value={week} onChange={e => setWeek(e.target.value)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "8px 12px", color: C.text, fontSize: "13px", outline: "none", colorScheme: "light dark" }} />
        )}
        {mode === "month" && (
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "8px 12px", color: C.text, fontSize: "13px", outline: "none", colorScheme: "light dark" }} />
        )}

        {!loading && records.length > 0 && <Summary records={records} />}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", color: C.dim, fontSize: "14px" }}>
          Завантаження...
        </div>
      ) : isEmpty ? (
        <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", color: C.dim, fontSize: "14px" }}>
          Немає даних за обраний період
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <ChartCard title="PV вироблення">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={records} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
                <XAxis dataKey={xKey} tick={{ fill: C.dim, fontSize: isMobile ? 9 : 11 }} tickLine={false} axisLine={{ stroke: C.border }} interval={isMobile ? 3 : 1} />
                <YAxis tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={false} unit=" кВт" width={55} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(3)} кВт·год`]} />
                <Bar dataKey="pvYield" name="PV" fill={C.green} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: "16px" }}>
            <ChartCard title="Експорт vs Імпорт">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={records} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
                  <XAxis dataKey={xKey} tick={{ fill: C.dim, fontSize: isMobile ? 9 : 10 }} tickLine={false} axisLine={{ stroke: C.border }} interval={isMobile ? 3 : 1} />
                  <YAxis tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={false} unit=" кВт" width={50} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(3)} кВт·год`]} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px", color: C.muted }} />
                  <Bar dataKey="export" name="Експорт" fill={C.blue} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="import" name="Імпорт" fill={C.orange} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Дохід">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={records} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
                  <XAxis dataKey={xKey} tick={{ fill: C.dim, fontSize: isMobile ? 9 : 10 }} tickLine={false} axisLine={{ stroke: C.border }} interval={isMobile ? 3 : 1} />
                  <YAxis tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={false} unit=" ₪" width={45} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(2)} ₪`, "Дохід"]} />
                  <Line type="monotone" dataKey="revenue" name="Дохід" stroke={C.yellow} dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

    </div>
  )
}
