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

  const mode = (searchParams.get("mode") ?? "u3") as ScenarioMode

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

  // ── Місячна економія: симулюємо кожен день місяця окремо ─────────────────────
  const [year, month] = dateParam.split("-").map(Number)
  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const monthEnd   = new Date(Date.UTC(year, month, 1))

  const monthRecords = await prisma.inverterRecord.findMany({
    where: { timestamp: { gte: monthStart, lt: monthEnd } },
    select: { timestamp: true, pvYield: true, import: true, export: true },
    orderBy: { timestamp: "asc" },
  })

  // Групуємо по даті "YYYY-MM-DD"
  const byDay = new Map<string, HourInput[]>()
  for (const r of monthRecords) {
    const d = r.timestamp.toISOString().slice(0, 10)
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push({ hour: r.timestamp.getUTCHours(), pvKwh: r.pvYield, loadKwh: r.pvYield + r.import - r.export })
  }

  // Завантажуємо ціни РДН для всього місяця
  const monthRdnRows = await prisma.rdnPrice.findMany({
    where: { date: { gte: monthStart, lt: monthEnd } },
    select: { date: true, hour: true, price: true },
  })
  const rdnByDay = new Map<string, number[]>()
  for (const r of monthRdnRows) {
    const d = r.date.toISOString().slice(0, 10)
    if (!rdnByDay.has(d)) rdnByDay.set(d, Array(24).fill(0))
    rdnByDay.get(d)![r.hour] = r.price
  }

  let monthlySavings = 0
  let prevSoC = 0.5
  for (const [date, hours] of byDay) {
    const prices = rdnByDay.get(date) ?? dayPrices
    const result = simulateDay(date, hours.sort((a, b) => a.hour - b.hour), prices, config, mode, prevSoC)
    monthlySavings += result.savings
    prevSoC = result.hourly[result.hourly.length - 1]?.socEnd ?? 0.5
  }

  const daysWithData   = byDay.size || 1
  const avgDailySavings = monthlySavings / daysWithData
  const yearlySavings  = Math.round(avgDailySavings * 365 * 100) / 100

  const summary = {
    date: dateParam,
    avgDailySavingsUah: Math.round(dayResult.savings * 100) / 100,
    monthlySavingsUah:  Math.round(monthlySavings * 100) / 100,
    yearlySavingsUah:   yearlySavings,
    paybackYears: yearlySavings > 0
      ? Math.round((capacity * 30_000) / yearlySavings * 10) / 10
      : 99,
    hasRealData: true,
  }

  return NextResponse.json({ summary, latestDay: dayResult, dayPrices })
}
