// Battery Energy Storage System (BESS) Optimization
//
// Два бізнес-сценарії:
//   1. "cost_savings"  — мінімізація рахунку за електроенергію:
//        сонце покриває споживання → батарея зберігає надлишок сонця → заряд з мережі
//        у дешеві години → розряд замість дорогого імпорту в пікові години
//
//   2. "arbitrage"     — ціновий арбітраж (купити дешево → продати дорого):
//        у дешеві години — максимально заряджаємо батарею з мережі (навіть понад поточне споживання)
//        у дорогі години — максимально розряджаємо: спочатку покриваємо дефіцит, решту продаємо в РДН
//        різниця цін (ринок × 2–5) мінус ціна розподілу при купівлі = прибуток
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
export type BusinessGoal = "arbitrage" | "cost_savings"

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
  goal: BusinessGoal
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
  goal: "cost_savings",
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
  avgPriceUahMwh: number
  baselineCost: number
  optimizedCost: number
  savings: number
  selfConsumptionRate: number
  totalPv: number
  totalLoad: number
  gridChargeKwh: number
  totalSold: number        // кВт·год продано в мережу за добу
  totalRevenue: number     // дохід від продажу за добу, ₴
}

// ── Ядро алгоритму ────────────────────────────────────────────────────────────

function r3(n: number) { return Math.round(n * 1000) / 1000 }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

export function simulateDay(
  date: string,
  hours: HourInput[],
  prices: number[],
  config: BatteryConfig,
  initialSoC = 0.5,
): DayResult {
  const {
    capacityKwh, maxChargeKw, maxDischargeKw,
    minSoC, maxSoC, chargeEfficiency, dischargeEfficiency,
    gridChargeEnabled, chargeMaxPriceKwh, dischargeMinPriceKwh,
    goal,
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

    // Оптимізований сценарій
    let batAction  = 0
    let gridImport = 0
    let gridSell   = 0

    if (goal === "cost_savings") {
      // ── Стратегія: мінімізація витрат ──────────────────────────────────────
      // Пріоритет: сонце → батарея (дешеві години) → мережа у дорогі години
      if (net >= 0) {
        // Є надлишок сонця — заряджаємо батарею
        const canCharge = Math.min(net, maxChargeKw, ((maxSoC - soc) * capacityKwh) / chargeEfficiency)
        batAction = r3(Math.max(0, canCharge))
        soc = clamp(soc + (batAction * chargeEfficiency) / capacityKwh, minSoC, maxSoC)
        gridSell = r3(net - batAction)  // залишок сонця в мережу
      } else {
        const deficit = -net
        if (tier === "cheap" && gridChargeEnabled) {
          // Дешева година: заряджаємо з мережі
          const targetSoC = 0.80
          const canGridCharge = soc < targetSoC
            ? Math.min(maxChargeKw, ((targetSoC - soc) * capacityKwh) / chargeEfficiency)
            : 0
          batAction = r3(canGridCharge)
          if (batAction > 0) {
            soc = clamp(soc + (batAction * chargeEfficiency) / capacityKwh, minSoC, maxSoC)
            gridChargeKwh += batAction
          }
          gridImport = r3(deficit + batAction)
        } else if (tier === "expensive") {
          // Дорога година: розряджаємо батарею замість дорогого імпорту
          const canDischarge = Math.min(deficit, maxDischargeKw, (soc - minSoC) * capacityKwh * dischargeEfficiency)
          batAction = r3(-Math.max(0, canDischarge))
          soc = clamp(soc - ((-batAction) / dischargeEfficiency) / capacityKwh, minSoC, maxSoC)
          gridImport = r3(deficit - (-batAction))
        } else {
          gridImport = r3(deficit)
        }
      }

    } else {
      // ── Стратегія: ціновий арбітраж ────────────────────────────────────────
      // Купуємо максимально дешево → продаємо максимально дорого
      if (net >= 0) {
        if (tier === "expensive") {
          // Дорога година з надлишком сонця: продаємо і сонце, і розряд батареї
          const canDischarge = Math.min(maxDischargeKw, (soc - minSoC) * capacityKwh * dischargeEfficiency)
          batAction = r3(-canDischarge)
          soc = clamp(soc - (canDischarge / dischargeEfficiency) / capacityKwh, minSoC, maxSoC)
          gridSell = r3(net + canDischarge)  // сонце + батарея → в мережу
          gridImport = 0
        } else if (tier === "cheap" && gridChargeEnabled) {
          // Дешева година: заряджаємо від сонця + додатково з мережі
          const chargeSolar = Math.min(net, maxChargeKw, ((maxSoC - soc) * capacityKwh) / chargeEfficiency)
          soc = clamp(soc + (chargeSolar * chargeEfficiency) / capacityKwh, minSoC, maxSoC)
          const remCap = Math.min(maxChargeKw - chargeSolar, ((maxSoC - soc) * capacityKwh) / chargeEfficiency)
          const gridCharge = Math.max(0, remCap)
          if (gridCharge > 0) {
            soc = clamp(soc + (gridCharge * chargeEfficiency) / capacityKwh, minSoC, maxSoC)
            gridChargeKwh += gridCharge
          }
          batAction = r3(chargeSolar + gridCharge)
          gridImport = r3(gridCharge)
          gridSell   = r3(net - chargeSolar)  // незаряджений надлишок сонця
        } else {
          // Середня ціна: заряджаємо тільки від сонця, решту продаємо
          const chargeSolar = Math.min(net, maxChargeKw, ((maxSoC - soc) * capacityKwh) / chargeEfficiency)
          soc = clamp(soc + (chargeSolar * chargeEfficiency) / capacityKwh, minSoC, maxSoC)
          batAction = r3(chargeSolar)
          gridSell  = r3(net - chargeSolar)
        }
      } else {
        const deficit = -net
        if (tier === "cheap" && gridChargeEnabled) {
          // Дешева година: купуємо і на покриття дефіциту, і для подальшого продажу
          const canGridCharge = Math.min(maxChargeKw, ((maxSoC - soc) * capacityKwh) / chargeEfficiency)
          batAction = r3(canGridCharge)
          if (batAction > 0) {
            soc = clamp(soc + (batAction * chargeEfficiency) / capacityKwh, minSoC, maxSoC)
            gridChargeKwh += batAction
          }
          gridImport = r3(deficit + batAction)
        } else if (tier === "expensive") {
          // Дорога година: максимальний розряд → покриваємо дефіцит + продаємо надлишок
          const canDischarge = Math.min(maxDischargeKw, (soc - minSoC) * capacityKwh * dischargeEfficiency)
          batAction = r3(-canDischarge)
          soc = clamp(soc - (canDischarge / dischargeEfficiency) / capacityKwh, minSoC, maxSoC)
          const covered = Math.min(canDischarge, deficit)
          gridSell   = r3(canDischarge - covered)  // надлишок розряду → продаємо в мережу
          gridImport = r3(Math.max(0, deficit - canDischarge))
        } else {
          gridImport = r3(deficit)
        }
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

  const baselineCost   = r3(hourly.reduce((s, h) => s + h.baseCost, 0))
  const optimizedCost  = r3(hourly.reduce((s, h) => s + h.optCost, 0))
  const totalPv        = r3(hours.reduce((s, h) => s + h.pvKwh, 0))
  const totalLoad      = r3(hours.reduce((s, h) => s + h.loadKwh, 0))
  const totalSold      = r3(hourly.reduce((s, h) => s + h.optSell, 0))
  const totalRevenue   = r3(hourly.reduce((s, h) => s + Math.max(0, -h.optCost + h.optImport * (h.buyPriceUahKwh)), 0))

  const { dischargeEfficiency: dEff } = config
  const directUse  = r3(hourly.reduce((s, h) => s + Math.min(h.pvKwh, h.loadKwh), 0))
  const viaBattery = r3(hourly.reduce((s, h) => {
    if (h.batAction >= 0) return s
    const discharged   = (-h.batAction) * dEff
    const directCover  = Math.min(h.pvKwh, h.loadKwh)
    return s + Math.min(discharged, Math.max(0, h.loadKwh - directCover))
  }, 0))
  const selfConsumptionRate = totalPv > 0 ? r3(((directUse + viaBattery) / totalPv) * 100) : 0

  return {
    date,
    hourly,
    avgPriceUahMwh: r3(avgPrice),
    baselineCost,
    optimizedCost,
    savings: r3(baselineCost - optimizedCost),
    selfConsumptionRate,
    totalPv,
    totalLoad,
    gridChargeKwh: r3(gridChargeKwh),
    totalSold,
    totalRevenue: r3(hourly.reduce((s, h) => s + h.optSell * h.sellPriceUahKwh, 0)),
  }
}

// ── Fuzzy Preference Relations ────────────────────────────────────────────────

export type ScenarioMode = "u0" | "u1" | "u2" | "u3" | "u4"

export const MODE_LABELS: Record<ScenarioMode, string> = {
  u0: "Без батареї (u₀)",
  u1: "Заряд від сонця (u₁)",
  u2: "Ціновий арбітраж (u₂)",
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
  const {
    capacityKwh, maxChargeKw, maxDischargeKw,
    minSoC, maxSoC, chargeEfficiency, dischargeEfficiency,
    gridChargeEnabled, chargeMaxPriceKwh, dischargeMinPriceKwh,
  } = config
  const avgPrice = prices.reduce((s, p) => s + p, 0) / prices.length

  let totalPv = 0, directUse = 0, viaBattery = 0

  if (mode === "u0") {
    let cost = 0
    for (let i = 0; i < 24; i++) {
      const h = hours[i] ?? { hour: i, pvKwh: 0, loadKwh: 0 }
      const bPrc = (prices[i] ?? avgPrice) / 1000 + DISTRIBUTION_COST_UAH_KWH
      const sPrc = (prices[i] ?? avgPrice) / 1000
      const imp  = Math.max(0, h.loadKwh - h.pvKwh)
      const exp  = Math.max(0, h.pvKwh - h.loadKwh)
      cost += imp * bPrc - exp * sPrc
      totalPv    += h.pvKwh
      directUse  += Math.min(h.pvKwh, h.loadKwh)
    }
    return {
      cost: r3(cost), wear: 0,
      selfConsumptionPct: r3(totalPv > 0 ? (directUse / totalPv) * 100 : 0),
      socEnd: 0,
    }
  }

  let soc = clamp(initialSoC, minSoC, maxSoC)
  let cost = 0, wear = 0

  for (let i = 0; i < 24; i++) {
    const h = hours[i] ?? { hour: i, pvKwh: 0, loadKwh: 0 }
    const price  = prices[i] ?? avgPrice
    const bPrc   = price / 1000 + DISTRIBUTION_COST_UAH_KWH
    const sPrc   = price / 1000
    const tier   = priceTier(price, chargeMaxPriceKwh, dischargeMinPriceKwh)
    const net    = h.pvKwh - h.loadKwh

    totalPv   += h.pvKwh
    directUse += Math.min(h.pvKwh, h.loadKwh)

    let batCharge = 0, batDisch = 0, gridImport = 0, gridSell = 0

    if (net >= 0) {
      if (mode !== "u2") {
        const canCharge = Math.min(net, maxChargeKw, ((maxSoC - soc) * capacityKwh) / chargeEfficiency)
        batCharge = Math.max(0, canCharge)
        soc = clamp(soc + (batCharge * chargeEfficiency) / capacityKwh, minSoC, maxSoC)
        gridSell  = net - batCharge
      } else {
        // u2 арбітраж: в дорогу годину — продаємо і сонце, і батарею
        if (tier === "expensive") {
          const canDisch = Math.min(maxDischargeKw, (soc - minSoC) * capacityKwh * dischargeEfficiency)
          batDisch  = canDisch
          soc = clamp(soc - (canDisch / dischargeEfficiency) / capacityKwh, minSoC, maxSoC)
          gridSell  = net + canDisch
        } else {
          // не дорога: заряджаємо від сонця
          const canCharge = Math.min(net, maxChargeKw, ((maxSoC - soc) * capacityKwh) / chargeEfficiency)
          batCharge = canCharge
          soc = clamp(soc + (batCharge * chargeEfficiency) / capacityKwh, minSoC, maxSoC)
          gridSell  = net - batCharge
        }
      }
    } else {
      const deficit = -net
      if (mode === "u1") {
        if (tier === "expensive") {
          const canDisch = Math.min(deficit, maxDischargeKw, (soc - minSoC) * capacityKwh * dischargeEfficiency)
          batDisch = Math.max(0, canDisch)
          soc = clamp(soc - (batDisch / dischargeEfficiency) / capacityKwh, minSoC, maxSoC)
        }
        gridImport = Math.max(0, deficit - batDisch)
      } else if (mode === "u2") {
        // арбітраж: в дешеву — заряджаємо; в дорогу — максимальний розряд + продаємо надлишок
        if (tier === "cheap" && gridChargeEnabled) {
          const canGC = Math.min(maxChargeKw, ((maxSoC - soc) * capacityKwh) / chargeEfficiency)
          batCharge = canGC
          if (batCharge > 0) soc = clamp(soc + (batCharge * chargeEfficiency) / capacityKwh, minSoC, maxSoC)
          gridImport = deficit + batCharge
        } else if (tier === "expensive") {
          const canDisch = Math.min(maxDischargeKw, (soc - minSoC) * capacityKwh * dischargeEfficiency)
          batDisch   = canDisch
          soc = clamp(soc - (canDisch / dischargeEfficiency) / capacityKwh, minSoC, maxSoC)
          const covered = Math.min(canDisch, deficit)
          gridSell   = canDisch - covered
          gridImport = Math.max(0, deficit - canDisch)
        } else {
          gridImport = deficit
        }
      } else if (mode === "u3") {
        if (tier === "cheap" && gridChargeEnabled) {
          const targetSoC = 0.80
          const canGC = soc < targetSoC
            ? Math.min(maxChargeKw, ((targetSoC - soc) * capacityKwh) / chargeEfficiency)
            : 0
          batCharge = canGC
          if (batCharge > 0) soc = clamp(soc + (batCharge * chargeEfficiency) / capacityKwh, minSoC, maxSoC)
          gridImport = deficit + batCharge
        } else if (tier === "expensive") {
          const canDisch = Math.min(deficit, maxDischargeKw, (soc - minSoC) * capacityKwh * dischargeEfficiency)
          batDisch = Math.max(0, canDisch)
          soc = clamp(soc - (batDisch / dischargeEfficiency) / capacityKwh, minSoC, maxSoC)
          gridImport = Math.max(0, deficit - batDisch)
        } else {
          gridImport = deficit
        }
      } else if (mode === "u4") {
        const canDisch = Math.min(deficit, maxDischargeKw, (soc - minSoC) * capacityKwh * dischargeEfficiency)
        batDisch = Math.max(0, canDisch)
        soc = clamp(soc - (batDisch / dischargeEfficiency) / capacityKwh, minSoC, maxSoC)
        gridImport = Math.max(0, deficit - batDisch)
      }
    }

    cost += gridImport * bPrc - gridSell * sPrc
    wear += batCharge + batDisch

    if (batDisch > 0) {
      const directCover = Math.min(h.pvKwh, h.loadKwh)
      viaBattery += Math.min(batDisch, Math.max(0, h.loadKwh - directCover))
    }
  }

  const scPct = totalPv > 0 ? ((directUse + viaBattery) / totalPv) * 100 : 0
  return { cost: r3(cost), wear: r3(wear), selfConsumptionPct: r3(Math.min(100, scPct)), socEnd: r3(soc) }
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

// ── Порівняння сценаріїв за ємністю батареї ───────────────────────────────────

const INSTALL_COST_UAH_PER_KWH = 32_000

export interface ScenarioResult {
  capacityKwh: number
  avgDailySavings: number
  monthlySavings: number
  yearlySavings: number
  avgSelfConsumptionRate: number
  paybackYears: number
}

export function compareScenarios(
  allDayHours: HourInput[][],
  allDayPrices: number[][],
  capacities = [50, 100, 200, 400],
  goal: BusinessGoal = "cost_savings",
): ScenarioResult[] {
  return capacities.map(cap => {
    const config: BatteryConfig = {
      ...DEFAULT_BATTERY_CONFIG,
      capacityKwh: cap,
      maxChargeKw: cap * 0.5,
      maxDischargeKw: cap * 0.5,
      goal,
    }

    let prevSoC = 0.5
    const results = allDayHours.map((dayHours, i) => {
      const prices = allDayPrices[i] ?? allDayPrices[0] ?? []
      const date = new Date(Date.now() - (allDayHours.length - i) * 86_400_000)
        .toISOString().slice(0, 10)
      const result = simulateDay(date, dayHours, prices, config, prevSoC)
      prevSoC = result.hourly[result.hourly.length - 1]?.socEnd ?? 0.5
      return result
    })

    const avgDailySavings = r3(results.reduce((s, d) => s + d.savings, 0) / results.length)
    const avgSCR = r3(results.reduce((s, d) => s + d.selfConsumptionRate, 0) / results.length)
    const yearlySavings = r3(avgDailySavings * 365)
    const installCost = cap * INSTALL_COST_UAH_PER_KWH

    return {
      capacityKwh: cap,
      avgDailySavings,
      monthlySavings: r3(avgDailySavings * 30),
      yearlySavings,
      avgSelfConsumptionRate: avgSCR,
      paybackYears: yearlySavings > 0 ? r3(installCost / yearlySavings) : 99,
    }
  })
}
