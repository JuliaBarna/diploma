// Battery Energy Storage System (BESS) Optimization
//
// Стратегія мінімізації витрат:
//   Сонце покриває споживання → батарея зберігає надлишок сонця →
//   заряд з мережі у дешеві години → розряд замість дорогого імпорту в пікові години
//
// Ціноутворення (Україна):
//   Купівля:  ринкова ціна РДН  +  розподіл (3.6 UAH/kWh)
//   Продаж:   тільки ринкова ціна РДН (розподіл не компенсується при продажу)
// Ціна розподілу електроенергії — стала складова при купівлі з мережі
export const DISTRIBUTION_COST_UAH_KWH = 3.6

// UAH/MWh → UAH/kWh
export function mwhToKwh(priceUahMwh: number): number {
  return priceUahMwh / 1000
}

// Ціна купівлі = ринок + розподіл
export function buyPrice(priceUahMwh: number): number {
  return priceUahMwh / 1000 + DISTRIBUTION_COST_UAH_KWH
}

// Ціна продажу = тільки ринок (без розподілу)
export function sellPrice(priceUahMwh: number): number {
  return priceUahMwh / 1000
}

export function priceColor(priceUahMwh: number, chargeMaxPriceKwh: number, dischargeMinPriceKwh: number): string {
  const p = priceUahMwh / 1000
  if (p < chargeMaxPriceKwh)    return "#3b82f6"
  if (p > dischargeMinPriceKwh) return "#ef4444"
  return "#f97316"
}

export type PriceTier = "cheap" | "mid" | "expensive"

export function priceTier(
  priceUahMwh: number,
  chargeMaxPriceKwh: number,
  dischargeMinPriceKwh: number,
): PriceTier {
  const p = priceUahMwh / 1000
  if (p < chargeMaxPriceKwh)    return "cheap"
  if (p > dischargeMinPriceKwh) return "expensive"
  return "mid"
}

// ── Конфігурація батареї ──────────────────────────────────────────────────────

export interface BatteryConfig {
  capacityKwh: number
  maxChargeKw: number
  maxDischargeKw: number
  minSoC: number
  maxSoC: number
  chargeEfficiency: number
  dischargeEfficiency: number
  gridChargeEnabled: boolean
  chargeMaxPriceKwh: number     // ринкова ціна (UAH/kWh) нижче якої — заряд з мережі
  dischargeMinPriceKwh: number  // ринкова ціна (UAH/kWh) вище якої — розряд батареї
}

export const DEFAULT_BATTERY_CONFIG: BatteryConfig = {
  capacityKwh: 200,
  maxChargeKw: 100,
  maxDischargeKw: 100,
  minSoC: 0.10,
  maxSoC: 0.90,
  chargeEfficiency: 0.95,
  dischargeEfficiency: 0.95,
  gridChargeEnabled: true,
  chargeMaxPriceKwh: 4.0,
  dischargeMinPriceKwh: 7.0,
}

// ── Вхідні дані на годину ─────────────────────────────────────────────────────

export interface HourInput {
  hour: number
  pvKwh: number    // генерація сонячних панелей, кВт·год
  loadKwh: number  // споживання підприємства, кВт·год
}

// ── Результат симуляції по одній годині ──────────────────────────────────────

export interface HourlyResult {
  hour: number
  pvKwh: number
  loadKwh: number
  priceUahMwh: number
  priceUahKwh: number     // ринкова ціна (UAH/kWh)
  buyPriceUahKwh: number  // ціна купівлі = ринок + розподіл
  sellPriceUahKwh: number // ціна продажу = тільки ринок
  tier: PriceTier
  // Базовий сценарій (без батареї)
  baseImport: number      // імпорт з мережі, кВт·год
  baseExport: number      // продаж сонячного надлишку, кВт·год
  baseCost: number        // витрати − дохід, ₴ (може бути від'ємним при продажу)
  // Оптимізований сценарій
  batAction: number       // >0 заряд, <0 розряд (кВт·год)
  socEnd: number          // SoC в кінці години (0–1)
  optImport: number       // куплено з мережі, кВт·год
  optSell: number         // продано в мережу (сонце + батарея при арбітражі), кВт·год
  optCost: number         // чисті витрати: import×buyPrice − sell×sellPrice (від'ємне = прибуток)
}

export interface DayResult {
  date: string
  hourly: HourlyResult[]
  baselineCost: number
  optimizedCost: number
  savings: number
  gridChargeKwh: number
}

// ── Ядро алгоритму ────────────────────────────────────────────────────────────

function r3(n: number) { return Math.round(n * 1000) / 1000 }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

export function simulateDay(
  date: string,
  hours: HourInput[],
  prices: number[],
  config: BatteryConfig,
  mode: ScenarioMode = "u3",
  initialSoC = 0.5,
): DayResult {
  const {
    capacityKwh, maxChargeKw, maxDischargeKw,
    minSoC, maxSoC, chargeEfficiency, dischargeEfficiency,
    gridChargeEnabled, chargeMaxPriceKwh, dischargeMinPriceKwh,
  } = config

  const avgPrice = prices.reduce((s, p) => s + p, 0) / prices.length
  let soc = clamp(initialSoC, minSoC, maxSoC)
  let gridChargeKwh = 0
  const hourly: HourlyResult[] = []

  for (let i = 0; i < 24; i++) {
    const h = hours[i] ?? { hour: i, pvKwh: 0, loadKwh: 0 }
    const price = prices[i] ?? avgPrice
    const priceKwh  = price / 1000
    const bPrice    = priceKwh + DISTRIBUTION_COST_UAH_KWH   // buy price
    const sPrice    = priceKwh                                 // sell price
    const tier      = priceTier(price, chargeMaxPriceKwh, dischargeMinPriceKwh)
    const net       = h.pvKwh - h.loadKwh  // + надлишок сонця, − дефіцит

    // Базовий сценарій (без батареї)
    const baseImport = r3(Math.max(0, -net))
    const baseExport = r3(Math.max(0, net))
    const baseCost   = r3(baseImport * bPrice - baseExport * sPrice)

    let batAction  = 0
    let gridImport = 0
    let gridSell   = 0

    if (mode === "u0") {
      gridImport = baseImport
      gridSell   = baseExport
    } else if (net >= 0) {
      if (mode === "u2" && tier === "expensive") {
        // Арбітраж: продаємо сонце + розряд батареї за дорогою ціною
        const canDisch = Math.min(maxDischargeKw, (soc - minSoC) * capacityKwh * dischargeEfficiency)
        batAction = r3(-canDisch)
        soc = clamp(soc - (canDisch / dischargeEfficiency) / capacityKwh, minSoC, maxSoC)
        gridSell = r3(net + canDisch)
      } else {
        // u1, u2 (не дорога), u3, u4: заряд від сонця, залишок продаємо
        const canCharge = Math.min(net, maxChargeKw, ((maxSoC - soc) * capacityKwh) / chargeEfficiency)
        batAction = r3(Math.max(0, canCharge))
        soc = clamp(soc + (batAction * chargeEfficiency) / capacityKwh, minSoC, maxSoC)
        gridSell = r3(net - batAction)
      }
    } else {
      const deficit = -net
      if (mode === "u1") {
        // Тільки сонячний заряд: розряд лише у дорогі години
        if (tier === "expensive") {
          const canDisch = Math.min(deficit, maxDischargeKw, (soc - minSoC) * capacityKwh * dischargeEfficiency)
          batAction = r3(-Math.max(0, canDisch))
          soc = clamp(soc - ((-batAction) / dischargeEfficiency) / capacityKwh, minSoC, maxSoC)
        }
        gridImport = r3(deficit + batAction)
      } else if (mode === "u2") {
        // Арбітраж: дешево — заряд з мережі; дорого — максимальний розряд (+ продаж надлишку)
        if (tier === "cheap" && gridChargeEnabled) {
          const canGC = Math.min(maxChargeKw, ((maxSoC - soc) * capacityKwh) / chargeEfficiency)
          batAction = r3(canGC)
          if (batAction > 0) {
            soc = clamp(soc + (batAction * chargeEfficiency) / capacityKwh, minSoC, maxSoC)
            gridChargeKwh += batAction
          }
          gridImport = r3(deficit + batAction)
        } else if (tier === "expensive") {
          const canDisch = Math.min(maxDischargeKw, (soc - minSoC) * capacityKwh * dischargeEfficiency)
          batAction = r3(-canDisch)
          soc = clamp(soc - (canDisch / dischargeEfficiency) / capacityKwh, minSoC, maxSoC)
          const covered  = Math.min(canDisch, deficit)
          gridSell   = r3(canDisch - covered)
          gridImport = r3(Math.max(0, deficit - canDisch))
        } else {
          gridImport = r3(deficit)
        }
      } else if (mode === "u3") {
        // Комбінований: дешево — заряд до 80% SoC, дорого — розряд
        if (tier === "cheap" && gridChargeEnabled) {
          const targetSoC = 0.80
          const canGC = soc < targetSoC
            ? Math.min(maxChargeKw, ((targetSoC - soc) * capacityKwh) / chargeEfficiency)
            : 0
          batAction = r3(canGC)
          if (batAction > 0) {
            soc = clamp(soc + (batAction * chargeEfficiency) / capacityKwh, minSoC, maxSoC)
            gridChargeKwh += batAction
          }
          gridImport = r3(deficit + batAction)
        } else if (tier === "expensive") {
          const canDisch = Math.min(deficit, maxDischargeKw, (soc - minSoC) * capacityKwh * dischargeEfficiency)
          batAction = r3(-Math.max(0, canDisch))
          soc = clamp(soc - ((-batAction) / dischargeEfficiency) / capacityKwh, minSoC, maxSoC)
          gridImport = r3(deficit + batAction)
        } else {
          gridImport = r3(deficit)
        }
      } else if (mode === "u4") {
        // Мінімізація піків: завжди розряджаємо при дефіциті
        const canDisch = Math.min(deficit, maxDischargeKw, (soc - minSoC) * capacityKwh * dischargeEfficiency)
        batAction = r3(-Math.max(0, canDisch))
        soc = clamp(soc - ((-batAction) / dischargeEfficiency) / capacityKwh, minSoC, maxSoC)
        gridImport = r3(deficit + batAction)
      }
    }

    const optSell    = r3(Math.max(0, gridSell))
    const optImport  = r3(Math.max(0, gridImport))
    const optCost    = r3(optImport * bPrice - optSell * sPrice)

    hourly.push({
      hour: h.hour,
      pvKwh: h.pvKwh,
      loadKwh: h.loadKwh,
      priceUahMwh: price,
      priceUahKwh: r3(priceKwh),
      buyPriceUahKwh: r3(bPrice),
      sellPriceUahKwh: r3(sPrice),
      tier,
      baseImport,
      baseExport,
      baseCost,
      batAction,
      socEnd: r3(soc),
      optImport,
      optSell,
      optCost,
    })
  }

  const baselineCost  = r3(hourly.reduce((s, h) => s + h.baseCost, 0))
  const optimizedCost = r3(hourly.reduce((s, h) => s + h.optCost, 0))

  return {
    date,
    hourly,
    baselineCost,
    optimizedCost,
    savings: r3(baselineCost - optimizedCost),
    gridChargeKwh: r3(gridChargeKwh),
  }
}

// ── Fuzzy Preference Relations ────────────────────────────────────────────────

export type ScenarioMode = "u0" | "u1" | "u2" | "u3" | "u4"

export const MODE_LABELS: Record<ScenarioMode, string> = {
  u0: "Без батареї (u₀)",
  u1: "Заряд від сонця (u₁)",
  u2: "Заряд з мережі (u₂)",
  u3: "Комбінований (u₃)",
  u4: "Мінімізація піків (u₄)",
}

export interface ScenarioCriteria {
  mode: ScenarioMode
  label: string
  f1Cost: number
  f2Wear: number
  f3Renewable: number
}

export interface FuzzyAnalysisResult {
  criteria: ScenarioCriteria[]
  preferenceMatrix: number[][]
  strictPreference: number[][]
  nonDomination: number[]
  bestMode: ScenarioMode
  ranking: ScenarioMode[]
}

const FUZZY_WEIGHTS: [number, number, number] = [0.5, 0.2, 0.3]

function evalDayMode(
  mode: ScenarioMode,
  hours: HourInput[],
  prices: number[],
  config: BatteryConfig,
  initialSoC: number,
): { cost: number; wear: number; selfConsumptionPct: number; socEnd: number } {
  const result = simulateDay("", hours, prices, config, mode, initialSoC)
  let totalPv = 0, directUse = 0, viaBattery = 0, wear = 0
  for (const h of result.hourly) {
    totalPv   += h.pvKwh
    directUse += Math.min(h.pvKwh, h.loadKwh)
    wear      += Math.abs(h.batAction)
    if (h.batAction < 0) {
      const batDisch    = -h.batAction
      const directCover = Math.min(h.pvKwh, h.loadKwh)
      viaBattery += Math.min(batDisch, Math.max(0, h.loadKwh - directCover))
    }
  }
  const scPct  = totalPv > 0 ? ((directUse + viaBattery) / totalPv) * 100 : 0
  const socEnd = result.hourly[result.hourly.length - 1]?.socEnd ?? r3(clamp(initialSoC, config.minSoC, config.maxSoC))
  return {
    cost: result.optimizedCost,
    wear: r3(wear),
    selfConsumptionPct: r3(Math.min(100, scPct)),
    socEnd: r3(socEnd),
  }
}

function buildPreferenceMatrix(normalized: number[]): number[][] {
  const n = normalized.length
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 1
      const fi = normalized[i], fj = normalized[j]
      return fi >= fj ? 1 : r3(fi / (fj || 1e-9))
    })
  )
}

export function runFuzzyAnalysis(
  allDayHours: HourInput[][],
  allDayPrices: number[][],
  config: BatteryConfig,
): FuzzyAnalysisResult {
  const modes: ScenarioMode[] = ["u0", "u1", "u2", "u3", "u4"]
  const nm = modes.length

  const raw = modes.map(mode => {
    let sumCost = 0, sumWear = 0, sumSC = 0
    let prevSoC = 0.5
    for (let d = 0; d < allDayHours.length; d++) {
      const prices = allDayPrices[d] ?? allDayPrices[0]
      const res = evalDayMode(mode, allDayHours[d], prices, config, prevSoC)
      sumCost += res.cost
      sumWear += res.wear
      sumSC   += res.selfConsumptionPct
      prevSoC  = res.socEnd || 0.5
    }
    const nd = allDayHours.length || 1
    return { f1: r3(sumCost / nd), f2: r3(sumWear / nd), f3: r3(sumSC / nd) }
  })

  function normMin(vals: number[]): number[] {
    const lo = Math.min(...vals), hi = Math.max(...vals), rng = hi - lo || 1
    return vals.map(v => r3((hi - v) / rng))
  }
  function normMax(vals: number[]): number[] {
    const lo = Math.min(...vals), hi = Math.max(...vals), rng = hi - lo || 1
    return vals.map(v => r3((v - lo) / rng))
  }

  const nF1 = normMin(raw.map(r => r.f1))
  const nF2 = normMin(raw.map(r => r.f2))
  const nF3 = normMax(raw.map(r => r.f3))

  const R1 = buildPreferenceMatrix(nF1)
  const R2 = buildPreferenceMatrix(nF2)
  const R3 = buildPreferenceMatrix(nF3)

  const [w1, w2, w3] = FUZZY_WEIGHTS
  const R = Array.from({ length: nm }, (_, i) =>
    Array.from({ length: nm }, (_, j) =>
      r3(w1 * R1[i][j] + w2 * R2[i][j] + w3 * R3[i][j])
    )
  )

  const RS = Array.from({ length: nm }, (_, i) =>
    Array.from({ length: nm }, (_, j) =>
      r3(Math.max(0, R[i][j] - R[j][i]))
    )
  )

  const nonDomination = modes.map((_, i) => {
    const maxDom = Math.max(0, ...modes.map((_, j) => (j !== i ? RS[j][i] : 0)))
    return r3(1 - maxDom)
  })

  const ranking = [...modes].sort((a, b) =>
    nonDomination[modes.indexOf(b)] - nonDomination[modes.indexOf(a)]
  )

  return {
    criteria: modes.map((mode, i) => ({
      mode, label: MODE_LABELS[mode],
      f1Cost: raw[i].f1, f2Wear: raw[i].f2, f3Renewable: raw[i].f3,
    })),
    preferenceMatrix: R,
    strictPreference: RS,
    nonDomination,
    bestMode: ranking[0],
    ranking,
  }
}

