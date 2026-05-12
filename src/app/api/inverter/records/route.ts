import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date")
  const date = dateParam ? new Date(dateParam) : new Date()

  const dayStart = new Date(date)
  dayStart.setUTCHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setUTCHours(23, 59, 59, 999)

  const [records, rdnRows] = await Promise.all([
    prisma.inverterRecord.findMany({
      where: { timestamp: { gte: dayStart, lte: dayEnd } },
      orderBy: { timestamp: "asc" },
      select: { statisticalPeriod: true, timestamp: true, pvYield: true, export: true, import: true },
    }),
    prisma.rdnPrice.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      select: { hour: true, price: true },
    }),
  ])

  // карта: година → ціна грн/МВт·год
  const rdnMap = new Map(rdnRows.map(r => [r.hour, r.price]))

  const result = records.map((r) => {
    const hour = r.timestamp.getUTCHours()
    const rdnPrice = rdnMap.get(hour) ?? 0   // грн/МВт·год
    return {
      statisticalPeriod: r.statisticalPeriod,
      pvYield:     r.pvYield,
      export:      r.export,
      import:      r.import,
      consumption: r.pvYield + r.import - r.export,
      revenue:     Math.round(r.export * rdnPrice / 1000 * 100) / 100, // грн/кВт·год
    }
  })

  return NextResponse.json(result)
}
