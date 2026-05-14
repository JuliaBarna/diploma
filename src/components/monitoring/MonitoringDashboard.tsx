"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { LiveStats } from "@/lib/inverter-mock";

const C = {
  bg: "var(--c-bg)",
  card: "var(--c-card)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-muted)",
  dim: "var(--c-dim)",
  blue: "#3b82f6",
  green: "#22c55e",
  orange: "#f97316",
  purple: "#a855f7",
  yellow: "#eab308",
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: "12px",
        padding: "20px 24px",
        flex: 1,
        minWidth: "140px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: C.text,
              lineHeight: 1,
            }}
          >
            {value}
          </div>
          <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>
            {unit}
          </div>
        </div>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "rgba(34,197,94,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ fontSize: "13px", color: C.dim, marginTop: "12px" }}>
        {label}
      </div>
    </div>
  );
}

// ── Power Flow Diagram ────────────────────────────────────────────────────────
function PowerFlow({ pv, load, grid }: { pv: number; load: number; grid: number }) {
  const importing = grid < 0
  const exporting = grid > 0
  const pvActive  = pv > 0.01

  const gridColor = importing ? C.orange : exporting ? C.green : C.dim
  const pvColor   = pvActive  ? C.green  : C.dim

  const gridAnim = importing ? "pf-march 1.2s linear infinite"
    : exporting              ? "pf-march-rev 1.2s linear infinite"
    : "none"
  const pvAnim = pvActive ? "pf-march 1s linear infinite" : "none"

  // Node positions (viewBox 0 0 360 215)
  // Load  : rect (130,10)→(230,70),  bottom-center (180,70)
  // Grid  : rect (25,148)→(135,204), top-center    (80,148)
  // PV    : rect (225,148)→(335,204),top-center    (280,148)

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}>
      <style>{`
        @keyframes pf-march     { from { stroke-dashoffset: 20 } to { stroke-dashoffset: 0  } }
        @keyframes pf-march-rev { from { stroke-dashoffset: 0  } to { stroke-dashoffset: 20 } }
      `}</style>

      <svg viewBox="0 0 360 240" width="100%" style={{ display: "block" }}>

        {/* ── Криві (малюємо ПЕРШИМИ — іконки їх перекрива­ють) ────────── */}
        {/* Q з контрольною точкою ЗОВНІ viewBox → широка плавна дуга      */}
        {/* Сітка(80,148)→Будинок(180,72): дуга ліворуч, серед.≈(55,105)   */}
        <path d="M 80,148 Q -20,100 180,72"
          stroke={gridColor} strokeWidth="2.5" strokeDasharray="8 5" strokeLinecap="round"
          fill="none" style={{ animation: gridAnim }} />
        {/* PV(280,143)→Будинок(180,72): дуга праворуч, серед.≈(305,104)   */}
        <path d="M 280,143 Q 380,100 180,72"
          stroke={pvColor} strokeWidth="2.5" strokeDasharray="8 5" strokeLinecap="round"
          fill="none" style={{ animation: pvAnim }} />

        {/* ── Стрілки у середині дуг (відкритий простір, не перекриті) ─── */}
        {importing && <polygon points="0,-9 8,6 -8,6" fill={C.orange} transform="translate(55,105) rotate(50)"/>}
        {exporting && <polygon points="0,-9 8,6 -8,6" fill={C.green}  transform="translate(55,105) rotate(-130)"/>}
        {pvActive  && <polygon points="0,-9 8,6 -8,6" fill={C.green}  transform="translate(305,104) rotate(-50)"/>}

        {/* ══ Load node (top center) — будинок ══════════════════════════ */}
        <rect x="192" y="4" width="7" height="18" rx="1" fill="#455A64"/>
        <polygon points="153,22 180,5 207,22" fill="#37474F"/>
        <rect x="156" y="22" width="48" height="40" rx="2" fill="#546E7A"/>
        <rect x="186" y="22" width="18" height="40" fill="black" opacity="0.07"/>
        <rect x="162" y="28" width="10" height="9" rx="1" fill="#B3E5FC" opacity="0.85"/>
        <rect x="175" y="28" width="10" height="9" rx="1" fill="#B3E5FC" opacity="0.85"/>
        <rect x="188" y="28" width="10" height="9" rx="1" fill="#B3E5FC" opacity="0.85"/>
        <rect x="172" y="43" width="16" height="19" rx="1" fill="#37474F"/>
        <text x="180" y="100" textAnchor="middle" fontSize="13" fontWeight="700" fill={C.text}>
          {load.toFixed(2)} kW
        </text>
        <text x="180" y="110" textAnchor="middle" fontSize="9" fill={C.dim}>Споживання</text>

        {/* ══ Grid node (bottom left) — пілон ══════════════════════════ */}
        <line x1="56" y1="148" x2="104" y2="148" stroke={gridColor} strokeWidth="2.2"/>
        <circle cx="56" cy="148" r="2.5" fill={gridColor}/>
        <circle cx="104" cy="148" r="2.5" fill={gridColor}/>
        <line x1="80" y1="148" x2="80" y2="165" stroke={gridColor} strokeWidth="2.2"/>
        <line x1="60" y1="165" x2="100" y2="165" stroke={gridColor} strokeWidth="2.2"/>
        <circle cx="60" cy="165" r="2" fill={gridColor}/>
        <circle cx="100" cy="165" r="2" fill={gridColor}/>
        <line x1="80" y1="148" x2="60" y2="165" stroke={gridColor} strokeWidth="1.5"/>
        <line x1="80" y1="148" x2="100" y2="165" stroke={gridColor} strokeWidth="1.5"/>
        <line x1="80" y1="165" x2="73" y2="195" stroke={gridColor} strokeWidth="2"/>
        <line x1="80" y1="165" x2="87" y2="195" stroke={gridColor} strokeWidth="2"/>
        <line x1="73" y1="174" x2="87" y2="186" stroke={gridColor} strokeWidth="1.2"/>
        <line x1="87" y1="174" x2="73" y2="186" stroke={gridColor} strokeWidth="1.2"/>
        <line x1="73" y1="195" x2="58" y2="208" stroke={gridColor} strokeWidth="2.2"/>
        <line x1="87" y1="195" x2="102" y2="208" stroke={gridColor} strokeWidth="2.2"/>
        <line x1="51" y1="208" x2="65" y2="208" stroke={gridColor} strokeWidth="2.5"/>
        <line x1="95" y1="208" x2="109" y2="208" stroke={gridColor} strokeWidth="2.5"/>
        <text x="80" y="221" textAnchor="middle" fontSize="12" fontWeight="700" fill={gridColor}>
          {Math.abs(grid).toFixed(2)} kW
        </text>
        <text x="80" y="232" textAnchor="middle" fontSize="9" fill={C.dim}>
          {importing ? "Імпорт з мережі" : exporting ? "Експорт з мережі" : "Мережа"}
        </text>

        {/* ══ PV node (bottom right) — сонячна панель ══════════════════ */}
        {pvActive && <rect x="246" y="140" width="68" height="46" rx="4" fill={C.green} opacity="0.07"/>}
        <rect x="249" y="143" width="62" height="42" rx="3" fill="#0D47A1"/>
        <rect x="249" y="143" width="62" height="42" rx="3" fill="none" stroke="#1565C0" strokeWidth="1.5"/>
        <line x1="249" y1="157" x2="311" y2="157" stroke="#1976D2" strokeWidth="0.8"/>
        <line x1="249" y1="171" x2="311" y2="171" stroke="#1976D2" strokeWidth="0.8"/>
        <line x1="270" y1="143" x2="270" y2="185" stroke="#1976D2" strokeWidth="0.8"/>
        <line x1="290" y1="143" x2="290" y2="185" stroke="#1976D2" strokeWidth="0.8"/>
        <rect x="251" y="145" width="27" height="9" rx="2" fill="white" opacity="0.06"/>
        <line x1="280" y1="185" x2="280" y2="204" stroke="#546E7A" strokeWidth="2.5"/>
        <line x1="267" y1="204" x2="293" y2="204" stroke="#546E7A" strokeWidth="2.5"/>
        <text x="280" y="219" textAnchor="middle" fontSize="12" fontWeight="700"
          fill={pvActive ? C.green : C.text}>
          {pv.toFixed(2)} kW
        </text>
        <text x="280" y="230" textAnchor="middle" fontSize="9" fill={C.dim}>Сонячна генерація</text>

      </svg>
    </div>
  )
}

// ── Chart tab button ──────────────────────────────────────────────────────────
function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 14px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        borderRadius: "6px",
        border: "none",
        background: active ? C.orange : "transparent",
        color: active ? "#fff" : C.muted,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--c-bg)",
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    fontSize: "12px",
  },
  labelStyle: { color: C.muted },
  itemStyle: { color: C.text },
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function MonitoringDashboard() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [energyTab, setEnergyTab] = useState<"day" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const isMobile = useIsMobile();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const url = selectedDate
          ? `/api/inverter/live?date=${selectedDate}`
          : "/api/inverter/live";
        const res = await fetch(url);
        if (!cancelled) setStats(await res.json());
      } catch {
        /* ignore */
      }
    }

    load();
    const id = selectedDate ? undefined : setInterval(load, 30_000);
    return () => {
      cancelled = true;
      if (id !== undefined) clearInterval(id);
    };
  }, [selectedDate]);

  if (!stats) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "300px",
          color: C.dim,
          fontSize: "14px",
        }}
      >
        Завантаження...
      </div>
    );
  }

  const energyData =
    energyTab === "day" ? stats.energyChartData : stats.monthEnergyData;
  const xLabel = energyTab === "day" ? "Година" : "День";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Дата даних */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: C.dim, flexWrap: "wrap" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
        Дані за{" "}
        <strong style={{ color: C.muted }}>
          {new Date(stats.dataDate).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
        </strong>
        <span style={{ marginLeft: "4px", padding: "2px 8px", borderRadius: "4px", background: "rgba(234,179,8,0.12)", color: C.yellow, fontSize: "11px" }}>
          не в реальному часі
        </span>
        {!stats.hasData && selectedDate && (
          <span style={{ padding: "2px 8px", borderRadius: "4px", background: "rgba(239,68,68,0.12)", color: "#ef4444", fontSize: "11px" }}>
            немає даних за цю дату
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "4px" }}>
          <input
            type="date"
            value={selectedDate || stats.dataDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              padding: "4px 10px",
              color: C.text,
              fontSize: "13px",
              outline: "none",
              colorScheme: "light dark",
              cursor: "pointer",
            }}
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              title="Показати останню дату"
              style={{
                background: "rgba(249,115,22,0.12)",
                border: "none",
                borderRadius: "6px",
                color: C.orange,
                fontSize: "11px",
                padding: "4px 10px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              остання
            </button>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <KpiCard
          label="Вироблено сьогодні"
          value={stats.yieldToday.toFixed(2)}
          unit="кВт·год"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <polygon
                points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
                fill={C.green}
              />
            </svg>
          }
        />
        <KpiCard
          label="Отримано з мережі сьогодні"
          value={stats.supplyFromGrid.toFixed(2)}
          unit="кВт·год"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={C.green}
              strokeWidth="2"
            >
              <path d="M12 2v20M2 12h20" strokeLinecap="round" />
            </svg>
          }
        />
        <KpiCard
          label="Загальне вироблення"
          value={stats.totalYield.toFixed(2)}
          unit="МВт·год"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={C.green}
              strokeWidth="2"
            >
              <polyline
                points="22 12 18 12 15 21 9 3 6 12 2 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <KpiCard
          label="Дохід сьогодні"
          value={stats.revenueToday.toFixed(2)}
          unit="₪"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={C.green}
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round" />
              <path
                d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                strokeLinecap="round"
              />
            </svg>
          }
        />
      </div>

      {/* Power flow + Energy chart */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1.8fr",
          gap: "16px",
        }}
      >
        <PowerFlow
          pv={stats.pvPower}
          load={stats.loadPower}
          grid={stats.gridPower}
        />

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>
              Тренд енергії
            </span>
            <div
              style={{
                display: "flex",
                gap: "4px",
                background: "var(--c-bg)",
                borderRadius: "8px",
                padding: "3px",
              }}
            >
              <TabBtn
                active={energyTab === "day"}
                onClick={() => setEnergyTab("day")}
              >
                День
              </TabBtn>
              <TabBtn
                active={energyTab === "month"}
                onClick={() => setEnergyTab("month")}
              >
                Місяць
              </TabBtn>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={energyData}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis
                dataKey="time"
                tick={{ fill: C.dim, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: C.border }}
                label={{
                  value: xLabel,
                  position: "insideBottomRight",
                  offset: -4,
                  fill: C.dim,
                  fontSize: 11,
                }}
              />
              <YAxis
                tick={{ fill: C.dim, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                unit=" kWh"
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(v) => [`${Number(v).toFixed(1)} kWh`]}
              />
              <Legend
                wrapperStyle={{
                  fontSize: "12px",
                  color: C.muted,
                  paddingTop: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="pvOutput"
                name="Сонячна генерація"
                stroke={C.green}
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="gridPower"
                name="Імпорт з мережі"
                stroke={C.muted}
                dot={false}
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="consumption"
                name="Споживання"
                stroke={C.orange}
                dot={false}
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="export"
                name="Експорт"
                stroke={C.blue}
                dot={false}
                strokeWidth={1.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue chart */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
          padding: "20px",
        }}
      >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>
             Дохід
            </span>
            <div
              style={{
                background: "var(--c-bg)",
                borderRadius: "8px",
                padding: "3px",
              }}
            >
              <TabBtn active onClick={() => {}}>
                Місяць
              </TabBtn>
            </div>
          </div>
          <div
            style={{ fontSize: "13px", color: C.muted, marginBottom: "12px" }}
          >
            Загальний дохід{" "}
            <span style={{ fontWeight: 700, color: C.text }}>
              {stats.revenueChartData
                .reduce((s, r) => s + r.revenue, 0)
                .toFixed(2)}{" "}
            грн
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={stats.revenueChartData}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e2535"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: C.dim, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: C.border }}
              />
              <YAxis
                tick={{ fill: C.dim, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                unit=" ₪"
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(v) => [`${Number(v).toFixed(2)} ₪`]}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill={C.yellow}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
    </div>
  );
}
