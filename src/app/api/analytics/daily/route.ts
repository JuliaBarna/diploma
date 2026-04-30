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
    select: {
      timestamp: true,
      pvYield: true, inverterYield: true,
      export: true, import: true, revenue: true,
    },
    orderBy: { timestamp: "asc" },
  })

  const byDate = new Map<string, {
    pvYield: number; inverterYield: number
    export: number; import: number; revenue: number
  }>()

  for (const r of records) {
    const date = r.timestamp.toISOString().slice(0, 10)
    if (!byDate.has(date)) {
      byDate.set(date, { pvYield: 0, inverterYield: 0, export: 0, import: 0, revenue: 0 })
    }
    const d = byDate.get(date)!
    d.pvYield       += r.pvYield
    d.inverterYield += r.inverterYield
    d.export        += r.export
    d.import        += r.import
    d.revenue       += r.revenue
  }

  const daily = Array.from(byDate.entries()).map(([date, vals]) => ({
    date,
    day: date.slice(8, 10),
    ...vals,
  }))

  return NextResponse.json(daily)
}
