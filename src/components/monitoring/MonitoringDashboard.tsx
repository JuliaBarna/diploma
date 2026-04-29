"use client"

import { useState, useEffect } from "react"
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import type { LiveStats } from "@/lib/inverter-mock"

const C = {
  bg: "#0b0e14",
  card: "#13161f",
  border: "#1e2535",
  text: "#f1f5f9",
  muted: "#94a3b8",
  dim: "#475569",
  blue: "#3b82f6",
  green: "#22c55e",
  orange: "#f97316",
  purple: "#a855f7",
  yellow: "#eab308",
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, unit, icon }: { label: string; value: string; unit: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px",
      padding: "20px 24px", flex: 1, minWidth: 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: C.text, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>{unit}</div>
        </div>
        <div style={{
          width: "36px", height: "36px", borderRadius: "8px",
          background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>{icon}</div>
      </div>
      <div style={{ fontSize: "13px", color: C.dim, marginTop: "12px" }}>{label}</div>
    </div>
  )
}

// ── Alerts Bar ───────────────────────────────────────────────────────────────
function AlertsBar() {
  const items = [
    { label: "Critical", count: 0, color: "#ef4444" },
    { label: "Major", count: 0, color: "#f97316" },
    { label: "Minor", count: 0, color: "#eab308" },
    { label: "Warning", count: 0, color: "#3b82f6" },
  ]
  return (
    <div style={{
      display: "flex", gap: "12px", background: C.card,
      border: `1px solid ${C.border}`, borderRadius: "12px", padding: "14px 20px",
    }}>
      {items.map(({ label, count, color }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0,
          }} />
          <span style={{ fontSize: "13px", color: C.muted }}>{label}</span>
          <span style={{ fontSize: "20px", fontWeight: 700, color: C.text, marginLeft: "auto" }}>{count}</span>
        </div>
      ))}
    </div>
  )
}

// ── Power Flow Diagram ────────────────────────────────────────────────────────
function PowerFlow({ pv, load, grid }: { pv: number; load: number; grid: number }) {
  const isExporting = grid > 0
  const gridAbs = Math.abs(grid)

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px",
      padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "0",
    }}>
      {/* Load node */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
        <div style={{
          background: "#1e2535", border: `1px solid ${C.border}`, borderRadius: "10px",
          padding: "12px 20px", textAlign: "center", minWidth: "160px",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 6px", display: "block" }}>
            <rect x="2" y="7" width="20" height="13" rx="2" stroke={C.muted} strokeWidth="1.5" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={C.muted} strokeWidth="1.5" />
          </svg>
          <div style={{ fontSize: "18px", fontWeight: 700, color: C.text }}>{load.toFixed(1)} kW</div>
          <div style={{ fontSize: "11px", color: C.dim, marginTop: "2px" }}>Споживання</div>
        </div>
        {/* Vertical arrow down */}
        <svg width="2" height="32" viewBox="0 0 2 32">
          <line x1="1" y1="0" x2="1" y2="28" stroke={C.green} strokeWidth="2" strokeDasharray="4 2" />
          <polygon points="1,32 -3,24 5,24" fill={C.green} />
        </svg>
      </div>

      {/* Middle row: Grid ── center ── PV */}
      <div style={{ display: "flex", alignItems: "center", gap: "0", width: "100%" }}>
        {/* Grid node */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div style={{
            background: "#1e2535", border: `1px solid ${C.border}`, borderRadius: "10px",
            padding: "12px 16px", textAlign: "center",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 6px", display: "block" }}>
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: "16px", fontWeight: 700, color: isExporting ? C.green : C.orange }}>
              {gridAbs.toFixed(1)} kW
            </div>
            <div style={{ fontSize: "11px", color: C.dim, marginTop: "2px" }}>
              {isExporting ? "Експорт" : "Імпорт"}
            </div>
          </div>
        </div>

        {/* Horizontal arrows */}
        <div style={{ flex: 2, position: "relative", height: "2px" }}>
          <svg width="100%" height="20" style={{ overflow: "visible" }} viewBox="0 0 200 20">
            {isExporting ? (
              <>
                <line x1="100" y1="10" x2="10" y2="10" stroke={C.green} strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="6,10 14,6 14,14" fill={C.green} />
                <line x1="100" y1="10" x2="190" y2="10" stroke={C.green} strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="194,10 186,6 186,14" fill={C.green} />
              </>
            ) : (
              <>
                <line x1="10" y1="10" x2="100" y2="10" stroke={C.orange} strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="104,10 96,6 96,14" fill={C.orange} />
                <line x1="190" y1="10" x2="100" y2="10" stroke={C.green} strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="96,10 104,6 104,14" fill={C.green} />
              </>
            )}
          </svg>
        </div>

        {/* PV node */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div style={{
            background: "#1e2535", border: `1px solid ${C.border}`, borderRadius: "10px",
            padding: "12px 16px", textAlign: "center",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 6px", display: "block" }}>
              <rect x="2" y="8" width="20" height="12" rx="1" stroke={C.yellow} strokeWidth="1.5" />
              <line x1="2" y1="14" x2="22" y2="14" stroke={C.yellow} strokeWidth="1.5" />
              <line x1="9" y1="8" x2="9" y2="20" stroke={C.yellow} strokeWidth="1.5" />
              <line x1="15" y1="8" x2="15" y2="20" stroke={C.yellow} strokeWidth="1.5" />
              <path d="M12 3v3M8.5 4.5l2 2M15.5 4.5l-2 2" stroke={C.yellow} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: "16px", fontWeight: 700, color: C.green }}>{pv.toFixed(1)} kW</div>
            <div style={{ fontSize: "11px", color: C.dim, marginTop: "2px" }}>PV</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Chart tab button ──────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
      borderRadius: "6px", border: "none",
      background: active ? C.blue : "transparent",
      color: active ? "#fff" : C.muted,
      transition: "all 0.15s",
    }}>{children}</button>
  )
}

// ── Tooltip styles ────────────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: { background: "#1e2535", border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "12px" },
  labelStyle: { color: C.muted },
  itemStyle: { color: C.text },
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function MonitoringDashboard() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [energyTab, setEnergyTab] = useState<"day" | "month">("day")

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/inverter/live")
        if (!cancelled) setStats(await res.json())
      } catch { /* ignore */ }
    }

    load()
    const id = setInterval(load, 30_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  if (!stats) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: C.dim, fontSize: "14px" }}>
        Завантаження...
      </div>
    )
  }

  const energyData = energyTab === "day" ? stats.energyChartData : stats.monthEnergyData
  const xLabel = energyTab === "day" ? "Година" : "День"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* KPI row */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <KpiCard label="Вироблено сьогодні" value={stats.yieldToday.toFixed(2)} unit="кВт·год" icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={C.blue} stroke="none" />
          </svg>
        } />
        <KpiCard label="Отримано з мережі сьогодні" value={stats.supplyFromGrid.toFixed(2)} unit="кВт·год" icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2">
            <path d="M12 2v20M2 12h20" strokeLinecap="round" />
          </svg>
        } />
        <KpiCard label="Загальне вироблення" value={stats.totalYield.toFixed(2)} unit="МВт·год" icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        } />
        <KpiCard label="Дохід сьогодні" value={stats.revenueToday.toFixed(2)} unit="€" icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
          </svg>
        } />
      </div>

      {/* Alerts */}
      <AlertsBar />

      {/* Power flow + Energy chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "16px" }}>
        <PowerFlow pv={stats.pvPower} load={stats.loadPower} grid={stats.gridPower} />

        {/* Energy Trend */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>Energy Trend</span>
            <div style={{ display: "flex", gap: "4px", background: "#0b0e14", borderRadius: "8px", padding: "3px" }}>
              <TabBtn active={energyTab === "day"} onClick={() => setEnergyTab("day")}>День</TabBtn>
              <TabBtn active={energyTab === "month"} onClick={() => setEnergyTab("month")}>Місяць</TabBtn>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={energyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis dataKey="time" tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={{ stroke: C.border }} label={{ value: xLabel, position: "insideBottomRight", offset: -4, fill: C.dim, fontSize: 11 }} />
              <YAxis tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={false} unit=" kWh" />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)} kWh`]} />
              <Legend wrapperStyle={{ fontSize: "12px", color: C.muted, paddingTop: "8px" }} />
              <Line type="monotone" dataKey="pvOutput" name="PV output" stroke={C.green} dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="gridPower" name="Power from grid" stroke={C.muted} dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="consumption" name="Consumed" stroke={C.orange} dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue chart + Environmental benefits */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "16px" }}>
        {/* Revenue Trend */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>Revenue Trend</span>
            <div style={{ background: "#0b0e14", borderRadius: "8px", padding: "3px" }}>
              <TabBtn active onClick={() => {}}>Місяць</TabBtn>
            </div>
          </div>
          <div style={{ fontSize: "13px", color: C.muted, marginBottom: "12px" }}>
            Total revenue <span style={{ fontWeight: 700, color: C.text }}>
              {stats.revenueChartData.reduce((s, r) => s + r.revenue, 0).toFixed(2)} €
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.revenueChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={{ stroke: C.border }} />
              <YAxis tick={{ fill: C.dim, fontSize: 11 }} tickLine={false} axisLine={false} unit=" €" />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(2)} €`]} />
              <Bar dataKey="revenue" name="Revenue" fill={C.purple} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Environmental Benefits */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: C.text, marginBottom: "20px" }}>
            Environmental Benefits
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.8">
                  <path d="M14 6l1 2H5v13H3V8h2V5h8l1 1z" /><path d="M20 8l1 13H7V8" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: C.text }}>{stats.coalSaved.toFixed(2)}</div>
                <div style={{ fontSize: "12px", color: C.dim }}>тонн вугілля заощаджено</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.8">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" /><path d="M12 6v6l4 2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: C.text }}>{stats.co2Avoided.toFixed(2)}</div>
                <div style={{ fontSize: "12px", color: C.dim }}>тонн CO₂ скорочено</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.8">
                  <path d="M12 22V13M12 13C12 7 7 5 3 6c0 5 4 8 9 7zM12 13c0-6 5-8 9-7-1 5-4 8-9 7z" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: C.text }}>{stats.treesPlanted}</div>
                <div style={{ fontSize: "12px", color: C.dim }}>еквівалент дерев посаджено</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
