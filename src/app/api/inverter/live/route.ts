import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { LiveStats } from "@/lib/inverter-mock"

export const dynamic = "force-dynamic"

function r2(n: number) { return Math.round(n * 100) / 100 }

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date")

  let dataDate: string

  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    dataDate = dateParam
  } else {
    const lastRecord = await prisma.inverterRecord.findFirst({
      orderBy: { timestamp: "desc" },
      select: { timestamp: true },
    })
    if (!lastRecord) {
      return NextResponse.json({ error: "Немає даних в базі" }, { status: 404 })
    }
    dataDate = lastRecord.timestamp.toISOString().slice(0, 10)
  }
  const dayStart   = new Date(dataDate + "T00:00:00.000Z")
  const dayEnd     = new Date(dataDate + "T23:59:59.999Z")
  const monthStart = new Date(dataDate.slice(0, 7) + "-01T00:00:00.000Z")

  // ── Дані за останню добу ───────────────────────────────────────────────────
  const [dayRecords, dayRdnRows] = await Promise.all([
    prisma.inverterRecord.findMany({
      where: { timestamp: { gte: dayStart, lte: dayEnd } },
      orderBy: { timestamp: "asc" },
    }),
    prisma.rdnPrice.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      select: { hour: true, price: true },
    }),
  ])

  const dayRdnMap = new Map(dayRdnRows.map(r => [r.hour, r.price]))

  const yieldToday     = r2(dayRecords.reduce((s, r) => s + r.pvYield, 0))
  const supplyFromGrid = r2(dayRecords.reduce((s, r) => s + r.import,  0))
  const exportToday    = r2(dayRecords.reduce((s, r) => s + r.export,  0))
  const revenueToday   = r2(dayRecords.reduce((s, r) => {
    const rdnPrice = dayRdnMap.get(r.timestamp.getUTCHours()) ?? 0
    return s + r.export * rdnPrice / 1000
  }, 0))

  // Power flow: use the record matching the current real-world hour to simulate
  // live state for the selected date (if it's 15:00 now → show 15:00 of that day).
  // Timestamps are stored as local EEST (UTC+3) treated as UTC, so match by local hour.
  const currentHour = (new Date().getUTCHours() + 3) % 24
  const hourRecord  = dayRecords.find(r => r.timestamp.getUTCHours() === currentHour)
                   ?? dayRecords[dayRecords.length - 1]

  const pvPower   = r2(hourRecord?.pvYield ?? 0)
  const loadPower = r2(hourRecord ? hourRecord.pvYield + hourRecord.import - hourRecord.export : 0)
  const gridPower = r2(hourRecord ? hourRecord.export - hourRecord.import : 0)

  // ── Загальне вироблення за весь час ────────────────────────────────────────
  const agg = await prisma.inverterRecord.aggregate({ _sum: { pvYield: true } })
  const totalYield = r2((agg._sum.pvYield ?? 0) / 1000)

  // ── Графік по годинах за останню добу ─────────────────────────────────────
  const energyChartData = dayRecords.map(r => ({
    time:        r.statisticalPeriod,
    pvOutput:    r2(r.pvYield),
    gridPower:   r2(r.import),
    consumption: r2(r.pvYield + r.import - r.export),
    export:      r2(r.export),
  }))

  // ── Дані за місяць останньої доби ─────────────────────────────────────────
  const [monthRecords, monthRdnRows] = await Promise.all([
    prisma.inverterRecord.findMany({
      where: { timestamp: { gte: monthStart, lte: dayEnd } },
      orderBy: { timestamp: "asc" },
      select: { timestamp: true, pvYield: true, import: true, export: true },
    }),
    prisma.rdnPrice.findMany({
      where: { date: { gte: monthStart, lte: dayEnd } },
      select: { date: true, hour: true, price: true },
    }),
  ])

  // карта "YYYY-MM-DD:hour" → ціна
  const monthRdnMap = new Map(
    monthRdnRows.map(r => [`${r.date.toISOString().slice(0, 10)}:${r.hour}`, r.price])
  )

  const dayMap = new Map<string, { pv: number; imp: number; exp: number; rev: number }>()
  for (const r of monthRecords) {
    const day = r.timestamp.toISOString().slice(8, 10)
    const dateKey = r.timestamp.toISOString().slice(0, 10)
    const hour = r.timestamp.getUTCHours()
    const rdnPrice = monthRdnMap.get(`${dateKey}:${hour}`) ?? 0
    const d = dayMap.get(day) ?? { pv: 0, imp: 0, exp: 0, rev: 0 }
    d.pv  += r.pvYield;  d.imp += r.import
    d.exp += r.export;   d.rev += r.export * rdnPrice / 1000
    dayMap.set(day, d)
  }

  const monthEnergyData = Array.from(dayMap.entries()).map(([day, d]) => ({
    time:        day,
    pvOutput:    r2(d.pv),
    gridPower:   r2(d.imp),
    consumption: r2(d.pv + d.imp - d.exp),
    export:      r2(d.exp),
  }))

  const revenueChartData = Array.from(dayMap.entries()).map(([day, d]) => ({
    day,
    revenue: r2(d.rev),
  }))

  // ── Графік цін РДН ────────────────────────────────────────────────────────
  // День: погодинні ціни в порядку ринкової доби (01:00–00:00)
  const rdnDayData = Array.from({ length: 24 }, (_, i) => {
    const h = (i + 1) % 24  // 1,2,...,23,0
    return { time: `${String(h).padStart(2, "0")}:00`, price: r2(dayRdnMap.get(h) ?? 0) }
  })

  // Місяць: середня ціна за кожен день
  const rdnDayPriceMap = new Map<string, { sum: number; count: number }>()
  for (const r of monthRdnRows) {
    const day = r.date.toISOString().slice(8, 10)
    const d = rdnDayPriceMap.get(day) ?? { sum: 0, count: 0 }
    d.sum += r.price; d.count++
    rdnDayPriceMap.set(day, d)
  }
  const rdnMonthData = Array.from(rdnDayPriceMap.entries()).map(([day, d]) => ({
    time:  day,
    price: r2(d.sum / d.count),
  }))

  return NextResponse.json({
    pvPower,
    gridPower,
    loadPower,
    yieldToday,
    supplyFromGrid,
    exportToday,
    totalYield,
    revenueToday,
    energyChartData,
    monthEnergyData,
    revenueChartData,
    rdnDayData,
    rdnMonthData,
    coalSaved:    r2(totalYield * 0.4),
    co2Avoided:   r2(totalYield * 0.475),
    treesPlanted: Math.round(totalYield * 0.65),
    dataDate,
    hasData:      dayRecords.length > 0,
  } satisfies LiveStats)
}
