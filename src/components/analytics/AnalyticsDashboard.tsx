"use client"

import { useState, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
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

type Period = 7 | 30 | 90

interface Summary {
  totalPvYield: number
  totalInverterYield: number
  totalExport: number
  totalImport: number
  totalRevenue: number
  efficiency: number
  recordCount: number
}

interface DailyRow {
  date: string
  day: string
  pvYield: number
  inverterYield: number
  export: number
  import: number
  revenue: number
}

interface HourlyRow {
  hour: string
  avgPv: number
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--c-bg)", border: "1px solid var(--c-border)",
    borderRadius: "8px", fontSize: "12px",
  },
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

function KpiCard({ label, value, unit, color, icon }: {
  label: string; value: string; unit: string; color: string; icon: React.ReactNode
}) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px",
      padding: "20px 24px", flex: 1, minWidth: "140px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: C.text, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: "12px", color: C.muted, marginTop: "3px" }}>{unit}</div>
        </div>
        <div style={{
          width: "36px", height: "36px", borderRadius: "8px",
          background: `${color}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: "13px", color: C.dim, marginTop: "12px" }}>{label}</div>
    </div>
  )
}

function PeriodBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
      borderRadius: "6px", border: "none",
      background: active ? C.orange : "transparent",
      color: active ? "#fff" : C.muted,
      transition: "all 0.15s",
    }}>
      {children}
    </button>
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

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>(30)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [daily, setDaily] = useState<DailyRow[]>([])
  const [hourly, setHourly] = useState<HourlyRow[]>([])
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      fetch(`/api/analytics/summary?days=${period}`).then(r => r.json()),
      fetch(`/api/analytics/daily?days=${period}`).then(r => r.json()),
      fetch(`/api/analytics/hourly?days=${period}`).then(r => r.json()),
    ]).then(([s, d, h]) => {
      if (!cancelled) {
        setSummary(s)
        setDaily(d)
        setHourly(h)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [period])

  if (loading || !summary) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: C.dim, fontSize: "14px" }}>
        Завантаження...
      </div>
    )
  }

  const pvValue = summary.totalPvYield >= 1000
    ? (summary.totalPvYield / 1000).toFixed(2)
    : summary.totalPvYield.toFixed(1)
  const pvUnit = summary.totalPvYield >= 1000 ? "МВт·год" : "кВт·год"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Period selector */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", gap: "4px", background: "var(--c-bg)", borderRadius: "8px", padding: "3px" }}>
          {([7, 30, 90] as Period[]).map(p => (
            <PeriodBtn key={p} active={period === p} onClick={() => setPeriod(p)}>{p}д</PeriodBtn>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <KpiCard
          label="Вироблення PV"
          value={pvValue}
          unit={pvUnit}
          color={C.green}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2">
              <rect x="2" y="8" width="20" height="12" rx="1" />
              <line x1="2" y1="14" x2="22" y2="14" />
              <line x1="9" y1="8" x2="9" y2="20" />
              <line x1="15" y1="8" x2="15" y2="20" />
              <path d="M12 3v3M8.5 4.5l2 2M15.5 4.5l-2 2" strokeLinecap="round" />
            </svg>
          }
        />
        <KpiCard
          label="Дохід за період"
          value={summary.totalRevenue.toFixed(2)}
          unit="₪"
          color={C.yellow}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.yellow} strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
            </svg>
          }
        />
        <KpiCard
          label="Імпорт з мережі"
          value={summary.totalImport.toFixed(1)}
          unit="кВт·год"
          color={C.orange}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2">
              <polyline points="17 11 12 6 7 11" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="17 18 12 13 7 18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <KpiCard
          label="Ефективність інвертора"
          value={summary.efficiency.toFixed(1)}
          unit="%"
          color={C.blue}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </div>

      {/* Daily production */}
      <ChartCard title="Щоденне вироблення PV">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={daily} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={{ stroke: C.border }} />
            <YAxis tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={false} unit=" кВт" width={60} />
            <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(2)} кВт·год`, "PV"]} />
            <Bar dataKey="pvYield" name="PV вироблення" fill={C.green} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Export vs Import + Revenue */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr",
        gap: "16px",
      }}>
        <ChartCard title="Експорт vs Імпорт">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={{ stroke: C.border }} />
              <YAxis tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={false} unit=" кВт" width={55} />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(2)} кВт·год`]} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px", color: C.muted }} />
              <Bar dataKey="export" name="Експорт" fill={C.blue} radius={[3, 3, 0, 0]} />
              <Bar dataKey="import" name="Імпорт" fill={C.orange} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Дохід по днях">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={{ stroke: C.border }} />
              <YAxis tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={false} unit=" ₪" width={50} />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(2)} ₪`, "Дохід"]} />
              <Bar dataKey="revenue" name="Дохід" fill={C.yellow} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Hourly pattern */}
      <ChartCard title="Середнє вироблення по годинах доби">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={hourly} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fill: C.dim, fontSize: isMobile ? 9 : 11 }}
              tickLine={false}
              axisLine={{ stroke: C.border }}
              interval={isMobile ? 3 : 1}
            />
            <YAxis tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={false} unit=" кВт" width={55} />
            <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(3)} кВт·год`, "Серед. PV"]} />
            <Bar dataKey="avgPv" name="Серед. PV" fill={C.green} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  )
}
