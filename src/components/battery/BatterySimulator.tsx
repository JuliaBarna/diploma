"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ComposedChart, BarChart, Bar, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from "recharts"
import { priceColor, priceTier, type ScenarioMode, MODE_LABELS } from "@/lib/battery-optimizer"

// ── Типи (відображають відповідь API) ────────────────────────────────────────

interface HourlyResult {
  hour: number; pvKwh: number; loadKwh: number
  priceUahMwh: number; priceUahKwh: number
  buyPriceUahKwh: number; sellPriceUahKwh: number; tier: string
  baseImport: number; baseExport: number; baseCost: number
  batAction: number; socEnd: number
  optImport: number; optSell: number; optCost: number
}
interface DayResult {
  date: string
  hourly: HourlyResult[]
  baselineCost: number
  optimizedCost: number
  savings: number
  gridChargeKwh: number
}
interface Summary {
  date: string
  avgDailySavingsUah: number; monthlySavingsUah: number
  yearlySavingsUah: number; paybackYears: number
  hasRealData: boolean
}
interface SimulateResponse {
  summary: Summary
  latestDay: DayResult; dayPrices: number[]
}

// ── Стилі ─────────────────────────────────────────────────────────────────────

const C = {
  card: "var(--c-card)", border: "var(--c-border)",
  text: "var(--c-text)", muted: "var(--c-muted)", dim: "var(--c-dim)",
}

function fmt(n: number, dec = 1) { return n.toFixed(dec) }

function fmtCap(kwh: number): string {
  if (kwh >= 1000) {
    const mwh = kwh / 1000
    return `${mwh % 1 === 0 ? mwh.toFixed(0) : mwh.toFixed(1)} МВт·год`
  }
  return `${kwh} кВт·год`
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px 24px", flex: 1, minWidth: "160px" }}>
      <div style={{ fontSize: "12px", color: C.dim, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: "26px", fontWeight: 700, color: color ?? C.text, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: C.muted, marginTop: "4px" }}>{sub}</div>}
    </div>
  )
}

// ── Tooltip для головного графіка ─────────────────────────────────────────────

function HourTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: number }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 16px", fontSize: "13px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
      <div style={{ fontWeight: 600, color: C.text, marginBottom: "8px" }}>{String(label).padStart(2, "0")}:00</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginBottom: "3px" }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 600, color: C.text }}>
            {p.name.includes("UAH") ? `₴${fmt(p.value, 0)}/МВт·год` : `${fmt(p.value, 2)} кВт·год`}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Tooltip для графіка цін ───────────────────────────────────────────────────

function PriceTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: number }) {
  if (!active || !payload?.length) return null
  const p = payload[0].value
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "8px 12px", fontSize: "12px" }}>
      <div style={{ color: C.dim }}>{String(label).padStart(2, "0")}:00</div>
      <div style={{ fontWeight: 700, color: C.text }}>₴{fmt(p, 0)}/МВт·год</div>
      <div style={{ color: C.muted }}>= ₴{fmt(p / 1000, 3)}/кВт·год</div>
    </div>
  )
}

// ── Головний компонент ────────────────────────────────────────────────────────

export function BatterySimulator() {
  const [capacity, setCapacity] = useState(500)
  const [gridCharge, setGridCharge] = useState(true)
  const [chargeMaxKwh, setChargeMaxKwh] = useState(4.0)
  const [dischargeMinKwh, setDischargeMinKwh] = useState(7.0)
  const [selectedDate, setSelectedDate] = useState(() => "2026-04-01")
  const [prices, setPrices] = useState<number[]>(Array(24).fill(0))
  const [pricesText, setPricesText] = useState("")
  const [showPriceEditor, setShowPriceEditor] = useState(false)
  const [priceTextError, setPriceTextError] = useState(false)

  const [data, setData] = useState<SimulateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [noData, setNoData] = useState(false)

  const [mode, setMode] = useState<ScenarioMode>("u3")

const runSimulation = useCallback((overridePrices?: number[], overrideMode?: ScenarioMode) => {
    const p = overridePrices ?? prices
    const m = overrideMode ?? mode
    setLoading(true)
    const params = new URLSearchParams({
      date: selectedDate,
      capacity: String(capacity),
      gridCharge: String(gridCharge),
      chargeMaxPrice: String(chargeMaxKwh),
      dischargeMinPrice: String(dischargeMinKwh),
      mode: m,
      prices: p.join(","),
    })
    setNoData(false)
    fetch(`/api/battery/simulate?${params}`)
      .then(r => r.ok ? r.json() : r.json().then((e: { error?: string }) => Promise.reject(e)))
      .then((d: SimulateResponse) => { setData(d); setLoading(false) })
      .catch(() => { setNoData(true); setData(null); setLoading(false) })
  }, [capacity, gridCharge, chargeMaxKwh, dischargeMinKwh, selectedDate, prices, mode])

  // Load RDN prices from DB for the selected date, then run simulation + fuzzy
  useEffect(() => {
    let cancelled = false
    async function loadPricesAndSimulate() {
      try {
        const res = await fetch(`/api/rdn?date=${selectedDate}`)
        if (cancelled) return
        if (res.ok) {
          const json = await res.json() as { prices: number[] }
          if (!cancelled) {
            setPrices(json.prices)
            runSimulation(json.prices)
            return
          }
        }
      } catch { /* fall through */ }
      if (!cancelled) { runSimulation() }
    }
    loadPricesAndSimulate()
    return () => { cancelled = true }
  }, [selectedDate]) // eslint-disable-line react-hooks/exhaustive-deps

  function applyPriceText() {
    const parsed = pricesText.split(/[\s,;]+/).map(Number).filter(n => !isNaN(n) && n > 0)
    if (parsed.length !== 24) { setPriceTextError(true); return }
    setPriceTextError(false)
    setPrices(parsed)
    runSimulation(parsed)
  }

  // Дані для графіка цін
  const avgPrice = prices.reduce((s, p) => s + p, 0) / prices.length
  const priceChartData = prices.map((p, i) => ({ hour: i, price: p, tier: priceTier(p, chargeMaxKwh, dischargeMinKwh) }))

  // Дані для головного графіка симуляції
  const chartData = data?.latestDay.hourly.map(h => ({
    hour: h.hour,
    "Генерація PV": h.pvKwh,
    "Споживання": h.loadKwh,
    "Імпорт (без батареї)": h.baseImport,
    ...(mode !== "u0" ? { "Імпорт (з батареєю)": h.optImport } : {}),
    ...(mode === "u0" ? { "Експорт в мережу": h.baseExport } : {}),
    ...(mode !== "u0" ? { "SoC батареї (%)": h.socEnd * 100 } : {}),
  })) ?? []

  const s = data?.summary
  const ld = data?.latestDay

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Конфігурація ─────────────────────────────────────────────── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: C.text }}>Параметри симуляції</div>
          <button onClick={() => runSimulation()} disabled={loading}
            style={{ padding: "10px 32px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, background: loading ? "rgba(34,197,94,0.4)" : "#22c55e", color: "#fff", border: "none", cursor: loading ? "default" : "pointer" }}>
            {loading ? "Розрахунок..." : "Запустити"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>

          {/* Ємність */}
          <div style={{ padding: "20px", borderRadius: "10px", background: "var(--c-bg)", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "12px", color: C.dim, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ємність батареї</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <input
                type="number" value={capacity}
                onChange={e => { const v = Number(e.target.value); if (!isNaN(v) && v > 0) setCapacity(v) }}
                onBlur={() => setCapacity(v => Math.max(10, Math.min(10000, v)))}
                style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", fontSize: "20px", fontWeight: 700, border: `2px solid #22c55e`, background: "var(--c-card)", color: "#22c55e", width: 0 }}
              />
              <span style={{ fontSize: "14px", color: C.muted, flexShrink: 0 }}>кВт·год</span>
            </div>
            <div style={{ fontSize: "12px", color: C.dim, marginBottom: "4px" }}>
              = <strong style={{ color: "#22c55e" }}>{fmtCap(capacity)}</strong>
              {" · "}вартість установки ≈ <strong style={{ color: C.text }}>₴{(capacity * 30000).toLocaleString("uk-UA")}</strong>
            </div>
            <div style={{ fontSize: "12px", color: C.dim, marginTop: "8px", lineHeight: 1.5 }}>
              Фізичний розмір накопичувача. Більша ємність — більше енергії можна зберегти, але вища вартість.
            </div>
          </div>

          {/* Поріг заряду */}
          <div style={{ padding: "20px", borderRadius: "10px", background: "var(--c-bg)", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "12px", color: C.dim, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Поріг заряду з мережі</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <input
                type="number" value={chargeMaxKwh}
                onChange={e => { const v = Number(e.target.value); if (!isNaN(v) && v > 0) setChargeMaxKwh(v) }}
                onBlur={() => setChargeMaxKwh(v => Math.max(0.5, Math.min(10, v)))}
                style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", fontSize: "20px", fontWeight: 700, border: `2px solid #3b82f6`, background: "var(--c-card)", color: "#3b82f6", width: 0 }}
              />
              <span style={{ fontSize: "14px", color: C.muted, flexShrink: 0 }}>₴/кВт·год</span>
            </div>
            <div style={{ fontSize: "12px", color: C.dim, marginBottom: "4px" }}>
              <span style={{ color: "#3b82f6" }}>{prices.filter(p => p / 1000 < chargeMaxKwh).length} год/добу</span>
              {" · "}купівля з розподілом ≈ <strong style={{ color: "#3b82f6" }}>₴{fmt(chargeMaxKwh + 3.6, 2)}/кВт·год</strong>
            </div>
            <div style={{ fontSize: "12px", color: C.dim, marginTop: "8px", lineHeight: 1.5 }}>
              Коли ринкова ціна нижча за цей поріг — батарея заряджається з мережі.
            </div>
          </div>

          {/* Поріг розряду */}
          <div style={{ padding: "20px", borderRadius: "10px", background: "var(--c-bg)", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "12px", color: C.dim, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Поріг розряду батареї</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <input
                type="number" value={dischargeMinKwh}
                onChange={e => { const v = Number(e.target.value); if (!isNaN(v) && v > 0) setDischargeMinKwh(v) }}
                onBlur={() => setDischargeMinKwh(v => Math.max(1, Math.min(20, v)))}
                style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", fontSize: "20px", fontWeight: 700, border: `2px solid #ef4444`, background: "var(--c-card)", color: "#ef4444", width: 0 }}
              />
              <span style={{ fontSize: "14px", color: C.muted, flexShrink: 0 }}>₴/кВт·год</span>
            </div>
            <div style={{ fontSize: "12px", color: C.dim, marginBottom: "4px" }}>
              <span style={{ color: "#ef4444" }}>{prices.filter(p => p / 1000 > dischargeMinKwh).length} год/добу</span>
              {" · "}продаж в мережу за ринком
            </div>
            <div style={{ fontSize: "12px", color: C.dim, marginTop: "8px", lineHeight: 1.5 }}>
              Коли ринкова ціна вища за цей поріг — батарея розряджається замість купівлі дорогої електрики.
            </div>
          </div>

          {/* Період + заряд з мережі */}
          <div style={{ padding: "20px", borderRadius: "10px", background: "var(--c-bg)", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "12px", color: C.dim, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Дата аналізу</div>
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setSelectedDate(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "8px",
                  fontSize: "14px", border: `1px solid ${C.border}`,
                  background: "var(--c-card)", color: C.text,
                  colorScheme: "dark", boxSizing: "border-box",
                }}
              />
              <div style={{ fontSize: "12px", color: C.dim, marginTop: "8px", lineHeight: 1.5 }}>
                Оберіть конкретний день для аналізу. Якщо дані є в БД — використаються реальні значення генерації та споживання.
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: C.dim, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Заряд з мережі</div>
              <button onClick={() => setGridCharge(v => !v)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", fontSize: "14px", border: `2px solid ${gridCharge ? "#22c55e" : C.border}`, background: gridCharge ? "rgba(34,197,94,0.1)" : "transparent", color: gridCharge ? "#22c55e" : C.muted, cursor: "pointer", fontWeight: 500 }}>
                {gridCharge ? "✓ Дозволено" : "Заборонено"}
              </button>
              <div style={{ fontSize: "12px", color: C.dim, marginTop: "8px", lineHeight: 1.5 }}>
                {gridCharge
                  ? "Батарея може купувати дешеву електрику вночі для використання вдень."
                  : "Батарея заряджається тільки від сонячних панелей."}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Профіль цін РДН ──────────────────────────────────────────── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: C.text }}>Погодинні ціни РДН</div>
            <div style={{ fontSize: "12px", color: C.dim, marginTop: "2px" }}>
             
            
              Заряд нижче ₴{fmt(chargeMaxKwh, 1)}/кВт·год
              {" · "}
              Розряд вище ₴{fmt(dischargeMinKwh, 1)}/кВт·год
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
           
            <button onClick={() => setShowPriceEditor(v => !v)}
              style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", border: `1px solid ${C.border}`, background: showPriceEditor ? "rgba(59,130,246,0.1)" : "transparent", color: showPriceEditor ? "#3b82f6" : C.muted, cursor: "pointer" }}>
              {showPriceEditor ? "Сховати редактор" : "Редагувати ціни"}
            </button>
          </div>
        </div>

        {/* Міні-графік цін */}
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={priceChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap="10%">
            <XAxis dataKey="hour" tickFormatter={h => `${String(h).padStart(2, "0")}`}
              tick={{ fontSize: 10, fill: "var(--c-dim)" }} axisLine={false} tickLine={false} interval={1} />
            <YAxis hide domain={[0, "dataMax"]} />
            <Tooltip content={<PriceTooltip />} />
            <Bar dataKey="price" radius={[3, 3, 0, 0]}>
              {priceChartData.map((entry, i) => (
                <Cell key={i} fill={priceColor(entry.price, chargeMaxKwh, dischargeMinKwh)} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Легенда тірів */}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "8px" }}>
          {[
            { color: "#3b82f6", label: `Дешево — заряд з мережі (< ₴${fmt(chargeMaxKwh, 1)}/кВт·год)` },
            { color: "#f97316", label: "Середня ціна — просто купуємо" },
            { color: "#ef4444", label: `Дорого — розряд батареї (> ₴${fmt(dischargeMinKwh, 1)}/кВт·год)` },
          ].map(item => (
            <div key={item.color} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: C.muted }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Редактор цін */}
        {showPriceEditor && (
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "12px", color: C.dim, marginBottom: "8px" }}>
              Введіть 24 ціни через кому (UAH/МВт·год) за конкретну добу:
            </div>
            <textarea
              value={pricesText}
              onChange={e => { setPricesText(e.target.value); setPriceTextError(false) }}
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px", fontSize: "13px", fontFamily: "monospace",
                border: `1px solid ${priceTextError ? "#ef4444" : C.border}`,
                background: "var(--c-bg)", color: C.text, resize: "vertical", boxSizing: "border-box",
              }}
            />
            {priceTextError && (
              <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
                Потрібно рівно 24 числових значення через кому
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button onClick={applyPriceText}
                style={{ padding: "8px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, background: "#22c55e", color: "#fff", border: "none", cursor: "pointer" }}>
                Застосувати і запустити
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Немає даних ──────────────────────────────────────────────── */}
      {noData && !loading && (
        <div style={{
          background: C.card, border: `1px solid var(--c-border)`,
          borderRadius: "14px", padding: "40px 24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📭</div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--c-text)", marginBottom: "8px" }}>
            Немає даних за {selectedDate}
          </div>
          <div style={{ fontSize: "13px", color: "var(--c-dim)" }}>
            Оберіть іншу дату — лише дні з реальними даними інвертора доступні для аналізу.
          </div>
        </div>
      )}

      {/* ── KPI-картки ───────────────────────────────────────────────── */}
      {s && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <KpiCard label="Добова економія" value={`₴${fmt(s.avgDailySavingsUah, 0)}`} sub={`реальні дані · ${s.date}`} color="#22c55e" />
          <KpiCard label="На місяць" value={`₴${fmt(s.monthlySavingsUah, 0)}`} sub="30 днів" color="#22c55e" />
          <KpiCard label="На рік" value={`₴${fmt(s.yearlySavingsUah, 0)}`} sub="365 днів" />
          {s.yearlySavingsUah > 0 && (
            <KpiCard label="Окупність" value={`${fmt(s.paybackYears, 1)} р.`}
              sub={`${fmtCap(capacity)} × ₴30 000`}
              color={s.paybackYears < 5 ? "#22c55e" : s.paybackYears < 10 ? "#f97316" : "#ef4444"} />
          )}
        </div>
      )}

      {/* ── Вибір режиму симуляції ───────────────────────────────────── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px 24px" }}>
        <div style={{ fontSize: "12px", color: C.dim, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Стратегія керування батареєю</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(["u0", "u1", "u2", "u3", "u4"] as ScenarioMode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); runSimulation(undefined, m) }}
              style={{
                padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: m === mode ? 700 : 400,
                border: `2px solid ${m === mode ? "#22c55e" : C.border}`,
                background: m === mode ? "rgba(34,197,94,0.1)" : "transparent",
                color: m === mode ? "#22c55e" : C.muted, cursor: "pointer", transition: "all 0.15s",
              }}>
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Погодинна симуляція ───────────────────────────────────────── */}
      {ld && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: C.text }}>Погодинна симуляція — {ld.date}</div>
              <div style={{ fontSize: "12px", color: C.dim, marginTop: "2px" }}>{MODE_LABELS[mode]}</div>
            </div>
            <div style={{ display: "flex", gap: "20px", fontSize: "13px", flexWrap: "wrap" }}>
              {mode === "u0" ? (
                <span style={{ color: C.muted }}>Денні витрати: <strong style={{ color: C.text }}>₴{fmt(ld.baselineCost, 0)}</strong></span>
              ) : (
                <>
                  <span style={{ color: C.muted }}>Без батареї: <strong style={{ color: "#ef4444" }}>₴{fmt(ld.baselineCost, 0)}</strong></span>
                  <span style={{ color: C.muted }}>З батареєю: <strong style={{ color: "#22c55e" }}>₴{fmt(ld.optimizedCost, 0)}</strong></span>
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>Економія: ₴{fmt(ld.savings, 0)}</span>
                </>
              )}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
              <XAxis dataKey="hour" tickFormatter={h => `${String(h).padStart(2, "0")}:00`}
                tick={{ fontSize: 11, fill: "var(--c-dim)" }} interval={2} axisLine={false} tickLine={false} />
              <YAxis yAxisId="kwh" tick={{ fontSize: 11, fill: "var(--c-dim)" }}
                axisLine={false} tickLine={false} width={55} tickFormatter={v => `${v} кВт`} />
              {mode !== "u0" && (
                <YAxis yAxisId="soc" orientation="right" domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "var(--c-dim)" }} axisLine={false} tickLine={false} width={40}
                  tickFormatter={v => `${v}%`} />
              )}
              <Tooltip content={<HourTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
              <Bar yAxisId="kwh" dataKey="Генерація PV" fill="#22c55e" opacity={0.75} radius={[2, 2, 0, 0]} />
              <Line yAxisId="kwh" type="monotone" dataKey="Споживання" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Area yAxisId="kwh" type="monotone" dataKey="Імпорт (без батареї)"
                stroke="#6b7280" fill="#6b7280" fillOpacity={0.15} strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              {mode !== "u0" && (
                <Area yAxisId="kwh" type="monotone" dataKey="Імпорт (з батареєю)"
                  stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} dot={false} />
              )}
              {mode === "u0" && (
                <Area yAxisId="kwh" type="monotone" dataKey="Експорт в мережу"
                  stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} dot={false} />
              )}
              {mode !== "u0" && (
                <Line yAxisId="soc" type="monotone" dataKey="SoC батареї (%)"
                  stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="6 2" />
              )}
            </ComposedChart>
          </ResponsiveContainer>

          <div style={{ marginTop: "16px", padding: "12px 16px", borderRadius: "8px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", fontSize: "12px", color: C.muted, lineHeight: 1.6 }}>
            <strong style={{ color: "#3b82f6" }}>Читання графіка:</strong>{" "}
            🟢 стовпці — сонячна генерація; 🔴 лінія — споживання;{" "}
            {mode === "u0"
              ? "⬛ заливка — імпорт з мережі; 🟡 заливка — надлишок сонця, проданий в мережу."
              : "⬛ пунктир — імпорт без батареї; 🔵 заливка — імпорт з батареєю; 🟣 пунктир — рівень заряду батареї (права вісь %)."}
            {ld.gridChargeKwh > 0 && ` Заряджено з дешевої мережі: ${fmt(ld.gridChargeKwh, 1)} кВт·год.`}
          </div>
        </div>
      )}


    </div>
  )
}
