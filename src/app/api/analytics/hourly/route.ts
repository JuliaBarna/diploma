import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get("days") ?? "30")

  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const records = await prisma.inverterRecord.findMany({
    where: { timestamp: { gte: since } },
    select: { timestamp: true, pvYield: true },
  })

  const byHour = new Map<number, { sum: number; count: number }>()

  for (const r of records) {
    const hour = r.timestamp.getUTCHours()
    if (!byHour.has(hour)) byHour.set(hour, { sum: 0, count: 0 })
    const h = byHour.get(hour)!
    h.sum += r.pvYield
    h.count++
  }

  const hourly = Array.from({ length: 24 }, (_, h) => {
    const data = byHour.get(h)
    return {
      hour: `${String(h).padStart(2, "0")}:00`,
      avgPv: data ? data.sum / data.count : 0,
    }
  })

  return NextResponse.json(hourly)
}
