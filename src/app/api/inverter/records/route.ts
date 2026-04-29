import { NextRequest, NextResponse } from "next/server"
import { generateDayRecords } from "@/lib/inverter-mock"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date")
  const date = dateParam ? new Date(dateParam) : new Date()

  const dayStart = new Date(date)
  dayStart.setUTCHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setUTCHours(23, 59, 59, 999)

  const dbRecords = await prisma.inverterRecord.findMany({
    where: { timestamp: { gte: dayStart, lte: dayEnd } },
    orderBy: { timestamp: "asc" },
  })

  if (dbRecords.length > 0) {
    return NextResponse.json(dbRecords.map((r) => ({
      statisticalPeriod: r.statisticalPeriod,
      globalIrradiation: r.globalIrradiation,
      avgTemperature:    r.avgTemperature,
      theoreticalYield:  r.theoreticalYield,
      pvYield:           r.pvYield,
      inverterYield:     r.inverterYield,
      export:            r.export,
      import:            r.import,
      lossExportKwh:     r.lossExportKwh,
      lossExportEur:     r.lossExportEur,
      charge:            r.charge,
      discharge:         r.discharge,
      revenue:           r.revenue,
    })))
  }

  return NextResponse.json(generateDayRecords(date))
}
