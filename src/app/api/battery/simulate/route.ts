import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  simulateDay,
  DEFAULT_BATTERY_CONFIG,
  type BatteryConfig,
  type HourInput,
  type ScenarioMode,
} from "@/lib/battery-optimizer"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const dateParam         = searchParams.get("date") ?? new Date().toISOString().slice(0, 10)
  const capacity          = Number(searchParams.get("capacity")          ?? DEFAULT_BATTERY_CONFIG.capacityKwh)
  const gridCharge        = searchParams.get("gridCharge") !== "false"
  const chargeMaxPrice    = Number(searchParams.get("chargeMaxPrice")    ?? DEFAULT_BATTERY_CONFIG.chargeMaxPriceKwh)
  const dischargeMinPrice = Number(searchParams.get("dischargeMinPrice") ?? DEFAULT_BATTERY_CONFIG.dischargeMinPriceKwh)

  const mode         = (searchParams.get("mode") ?? "u3") as ScenarioMode
  const batteryPrice = Number(searchParams.get("batteryPrice") ?? 6200)

  const config: BatteryConfig = {
    ...DEFAULT_BATTERY_CONFIG,
    capacityKwh:          capacity,
    maxChargeKw:          capacity * 0.5,
    maxDischargeKw:       capacity * 0.5,
    gridChargeEnabled:    gridCharge,
    chargeMaxPriceKwh:    chargeMaxPrice,
    dischargeMinPriceKwh: dischargeMinPrice,
  }

  // ── Ціни РДН для обраного дня ────────────────────────────────────────────────
  const rawPrices = searchParams.get("prices")
  let dayPrices: number[]
  if (rawPrices) {
    dayPrices = rawPrices.split(",").map(Number).slice(0, 24)
  } else {
    const dayStart = new Date(dateParam + "T00:00:00.000Z")
    const dayEnd   = new Date(dateParam + "T23:59:59.999Z")
    const rdnRows  = await prisma.rdnPrice.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      select: { hour: true, price: true },
    })
    dayPrices = Array.from({ length: 24 }, (_, h) => rdnRows.find(r => r.hour === h)?.price ?? 0)
  }
  while (dayPrices.length < 24) dayPrices.push(dayPrices[dayPrices.length - 1] ?? 0)

  // ── Дані інвертора за обраний день ───────────────────────────────────────────
  const dayStart = new Date(dateParam + "T00:00:00.000Z")
  const dayEnd   = new Date(dateParam + "T23:59:59.999Z")

  const dbRecords = await prisma.inverterRecord.findMany({
    where: { timestamp: { gte: dayStart, lte: dayEnd } },
    select: { timestamp: true, pvYield: true, import: true, export: true },
    orderBy: { timestamp: "asc" },
  })

  if (dbRecords.length === 0) {
    return NextResponse.json({ error: `Немає даних за ${dateParam}` }, { status: 404 })
  }

  const dayHours: HourInput[] = dbRecords
    .map(r => ({ hour: r.timestamp.getUTCHours(), pvKwh: r.pvYield, loadKwh: r.pvYield + r.import - r.export }))
    .sort((a, b) => a.hour - b.hour)

  const dayResult = simulateDay(dateParam, dayHours, dayPrices, config, mode, 0)

  // ── Усі наявні дані: для точного розрахунку окупності та місячного KPI ──────
  const [allInverterRows, allRdnRows] = await Promise.all([
    prisma.inverterRecord.findMany({
      select: { timestamp: true, pvYield: true, import: true, export: true },
      orderBy: { timestamp: "asc" },
    }),
    prisma.rdnPrice.findMany({
      select: { date: true, hour: true, price: true },
    }),
  ])

  const allByDay = new Map<string, HourInput[]>()
  for (const r of allInverterRows) {
    const d = r.timestamp.toISOString().slice(0, 10)
    if (!allByDay.has(d)) allByDay.set(d, [])
    allByDay.get(d)!.push({ hour: r.timestamp.getUTCHours(), pvKwh: r.pvYield, loadKwh: r.pvYield + r.import - r.export })
  }

  const allRdnByDay = new Map<string, number[]>()
  for (const r of allRdnRows) {
    const d = r.date.toISOString().slice(0, 10)
    if (!allRdnByDay.has(d)) allRdnByDay.set(d, Array(24).fill(0))
    allRdnByDay.get(d)![r.hour] = r.price
  }

  const monthPrefix = dateParam.slice(0, 7)
  let monthlySavings = 0
  let prevSoC = 0
  const savingsByMonth = new Map<number, { total: number; count: number }>()

  for (const [date, hours] of allByDay) {
    const prices = allRdnByDay.get(date) ?? dayPrices
    const result = simulateDay(date, hours.sort((a, b) => a.hour - b.hour), prices, config, mode, prevSoC)
    const month = parseInt(date.slice(5, 7))
    const s = savingsByMonth.get(month) ?? { total: 0, count: 0 }
    s.total += result.savings
    s.count++
    savingsByMonth.set(month, s)
    if (date.startsWith(monthPrefix)) monthlySavings += result.savings
    prevSoC = result.hourly[result.hourly.length - 1]?.socEnd ?? 0
  }

  const DAYS_IN_MONTH: Record<number, number> = {
    1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
    7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
  }

  // Річна економія з урахуванням сезонності: середня по місяцю × дні місяця
  let yearlySavings = 0
  for (let m = 1; m <= 12; m++) {
    const s = savingsByMonth.get(m)
    const avgDaily = s ? s.total / s.count : 0
    yearlySavings += avgDaily * DAYS_IN_MONTH[m]
  }
  yearlySavings = Math.round(yearlySavings * 100) / 100

  const dataMonths = new Set(Array.from(allByDay.keys()).map(d => d.slice(0, 7))).size

  const summary = {
    date: dateParam,
    avgDailySavingsUah: Math.round(dayResult.savings * 100) / 100,
    monthlySavingsUah:  Math.round(monthlySavings * 100) / 100,
    yearlySavingsUah:   yearlySavings,
    paybackYears: yearlySavings > 0
      ? Math.round((capacity * batteryPrice) / yearlySavings * 10) / 10
      : 99,
    hasRealData: true,
    dataMonths,
  }

  return NextResponse.json({ summary, latestDay: dayResult, dayPrices })
}
