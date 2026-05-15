import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  runFuzzyAnalysis,
  DEFAULT_BATTERY_CONFIG,
  type BatteryConfig,
  type HourInput,
} from "@/lib/battery-optimizer"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const dateParam         = searchParams.get("date") ?? new Date().toISOString().slice(0, 10)
  const capacity          = Number(searchParams.get("capacity")         ?? DEFAULT_BATTERY_CONFIG.capacityKwh)
  const gridCharge        = searchParams.get("gridCharge") !== "false"
  const chargeMaxPrice    = Number(searchParams.get("chargeMaxPrice")   ?? DEFAULT_BATTERY_CONFIG.chargeMaxPriceKwh)
  const dischargeMinPrice = Number(searchParams.get("dischargeMinPrice") ?? DEFAULT_BATTERY_CONFIG.dischargeMinPriceKwh)

  const config: BatteryConfig = {
    ...DEFAULT_BATTERY_CONFIG,
    capacityKwh:         capacity,
    maxChargeKw:         capacity * 0.5,
    maxDischargeKw:      capacity * 0.5,
    gridChargeEnabled:   gridCharge,
    chargeMaxPriceKwh:   chargeMaxPrice,
    dischargeMinPriceKwh: dischargeMinPrice,
  }

  const [year, month] = dateParam.split("-").map(Number)
  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const monthEnd   = new Date(Date.UTC(year, month, 1))

  const [inverterRows, rdnRows] = await Promise.all([
    prisma.inverterRecord.findMany({
      where: { timestamp: { gte: monthStart, lt: monthEnd } },
      select: { timestamp: true, pvYield: true, import: true, export: true },
      orderBy: { timestamp: "asc" },
    }),
    prisma.rdnPrice.findMany({
      where: { date: { gte: monthStart, lt: monthEnd } },
      select: { date: true, hour: true, price: true },
    }),
  ])

  if (inverterRows.length === 0) {
    return NextResponse.json({ error: `Немає даних за ${year}-${String(month).padStart(2, "0")}` }, { status: 404 })
  }

  // Group inverter data by date
  const hoursByDay = new Map<string, HourInput[]>()
  for (const r of inverterRows) {
    const d = r.timestamp.toISOString().slice(0, 10)
    if (!hoursByDay.has(d)) hoursByDay.set(d, [])
    hoursByDay.get(d)!.push({
      hour: r.timestamp.getUTCHours(),
      pvKwh: r.pvYield,
      loadKwh: r.pvYield + r.import - r.export,
    })
  }

  // Group RDN prices by date
  const pricesByDay = new Map<string, number[]>()
  for (const r of rdnRows) {
    const d = r.date.toISOString().slice(0, 10)
    if (!pricesByDay.has(d)) pricesByDay.set(d, Array(24).fill(0))
    pricesByDay.get(d)![r.hour] = r.price
  }

  const sortedDates = [...hoursByDay.keys()].sort()
  const fallbackPrices = Array(24).fill(5000)

  const allDayHours:  HourInput[][] = sortedDates.map(d =>
    (hoursByDay.get(d) ?? []).sort((a, b) => a.hour - b.hour)
  )
  const allDayPrices: number[][] = sortedDates.map(d =>
    pricesByDay.get(d) ?? fallbackPrices
  )

  const result = runFuzzyAnalysis(allDayHours, allDayPrices, config)

  return NextResponse.json({ ...result, daysAnalyzed: sortedDates.length })
}
