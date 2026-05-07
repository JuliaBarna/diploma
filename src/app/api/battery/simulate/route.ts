import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  simulateDay,
  compareScenarios,
  runFuzzyAnalysis,
  DEFAULT_BATTERY_CONFIG,
  SAMPLE_OREE_PRICES,
  type BatteryConfig,
  type HourInput,
} from "@/lib/battery-optimizer"

// GET /api/battery/simulate
// Query params:
//   date=2026-04-01           — конкретна дата аналізу (YYYY-MM-DD)
//   capacity=500              — ємність батареї (кВт·год)
//   gridCharge=true           — дозволити заряд з мережі в дешеві години
//   chargeThreshold=0.7       — заряджати якщо ціна < avg × threshold
//   dischargeThreshold=1.1    — розряджати якщо ціна > avg × threshold
//   prices=2100,1900,...      — 24 ціни РДН через кому (UAH/MWh); якщо не передані — типові OREE
//   goal=cost_savings|arbitrage

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const dateParam         = searchParams.get("date") ?? new Date().toISOString().slice(0, 10)
  const capacity           = Number(searchParams.get("capacity") ?? DEFAULT_BATTERY_CONFIG.capacityKwh)
  const gridCharge         = searchParams.get("gridCharge") !== "false"
  const chargeMaxPrice     = Number(searchParams.get("chargeMaxPrice")    ?? DEFAULT_BATTERY_CONFIG.chargeMaxPriceKwh)
  const dischargeMinPrice  = Number(searchParams.get("dischargeMinPrice") ?? DEFAULT_BATTERY_CONFIG.dischargeMinPriceKwh)
  const goal               = (searchParams.get("goal") ?? "cost_savings") as "arbitrage" | "cost_savings"

  // Парсимо ціни
  const rawPrices = searchParams.get("prices")
  const dayPrices: number[] = rawPrices
    ? rawPrices.split(",").map(Number).slice(0, 24)
    : [...SAMPLE_OREE_PRICES]
  while (dayPrices.length < 24) dayPrices.push(dayPrices[dayPrices.length - 1] ?? 5000)

  const config: BatteryConfig = {
    ...DEFAULT_BATTERY_CONFIG,
    capacityKwh: capacity,
    maxChargeKw: capacity * 0.5,
    maxDischargeKw: capacity * 0.5,
    gridChargeEnabled: gridCharge,
    chargeMaxPriceKwh: chargeMaxPrice,
    dischargeMinPriceKwh: dischargeMinPrice,
    goal,
  }

  // Завантажуємо дані за конкретну добу
  const dayStart = new Date(dateParam + "T00:00:00.000Z")
  const dayEnd   = new Date(dateParam + "T23:59:59.999Z")

  const dbRecords = await prisma.inverterRecord.findMany({
    where: { timestamp: { gte: dayStart, lte: dayEnd } },
    select: { timestamp: true, pvYield: true, import: true },
    orderBy: { timestamp: "asc" },
  })

  if (dbRecords.length === 0) {
    return NextResponse.json(
      { error: `Немає даних за ${dateParam}` },
      { status: 404 }
    )
  }

  const dayHours: HourInput[] = dbRecords.map(r => ({
    hour: r.timestamp.getUTCHours(),
    pvKwh: r.pvYield,
    loadKwh: r.pvYield + r.import,
  }))

  // Сортуємо по годинах (на всяк випадок)
  dayHours.sort((a, b) => a.hour - b.hour)

  const allDayHours  = [dayHours]
  const allDayPrices = [dayPrices]

  const dayResult = simulateDay(dateParam, dayHours, dayPrices, config, 0.5)

  const summary = {
    date: dateParam,
    days: 1,
    avgDailySavingsUah:    Math.round(dayResult.savings * 100) / 100,
    monthlySavingsUah:     Math.round(dayResult.savings * 30 * 100) / 100,
    yearlySavingsUah:      Math.round(dayResult.savings * 365 * 100) / 100,
    avgSelfConsumptionRate: Math.round(dayResult.selfConsumptionRate * 10) / 10,
    paybackYears: dayResult.savings * 365 > 0
      ? Math.round((capacity * 32_000) / (dayResult.savings * 365) * 10) / 10
      : 99,
    avgPriceUahMwh: Math.round(dayPrices.reduce((s, p) => s + p, 0) / dayPrices.length),
    hasRealData: dbRecords.length > 0,
  }

  const scenarios = compareScenarios(allDayHours, allDayPrices, [200, 500, 1000, 2000], goal)
  const fuzzy     = runFuzzyAnalysis(allDayHours, allDayPrices, config)

  return NextResponse.json({
    config, summary, scenarios,
    latestDay: dayResult,
    dailyResults: [dayResult],
    dayPrices, fuzzy,
  })
}
