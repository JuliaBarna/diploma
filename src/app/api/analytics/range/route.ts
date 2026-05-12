import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from") // YYYY-MM-DD
  const to   = searchParams.get("to")   // YYYY-MM-DD

  if (!from || !to) {
    return NextResponse.json({ error: "from and to required" }, { status: 400 })
  }

  const [fy, fm, fd] = from.split("-").map(Number)
  const [ty, tm, td] = to.split("-").map(Number)
  const fromDate = new Date(Date.UTC(fy, fm - 1, fd))
  const toDate   = new Date(Date.UTC(ty, tm - 1, td + 1)) // inclusive

  const [records, rdnRows] = await Promise.all([
    prisma.inverterRecord.findMany({
      where: { timestamp: { gte: fromDate, lt: toDate } },
      select: {
        timestamp: true,
        pvYield: true, inverterYield: true,
        export: true, import: true,
      },
      orderBy: { timestamp: "asc" },
    }),
    prisma.rdnPrice.findMany({
      where: { date: { gte: fromDate, lt: toDate } },
      select: { date: true, hour: true, price: true },
    }),
  ])

  const rdnMap = new Map(rdnRows.map(r => [`${r.date.toISOString().slice(0, 10)}:${r.hour}`, r.price]))

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
    const rdnPrice = rdnMap.get(`${date}:${r.timestamp.getUTCHours()}`) ?? 0
    d.pvYield       += r.pvYield
    d.inverterYield += r.inverterYield
    d.export        += r.export
    d.import        += r.import
    d.revenue       += r.export * rdnPrice / 1000
  }

  const daily = Array.from(byDate.entries()).map(([date, vals]) => ({
    date,
    day: date.slice(8, 10),
    ...vals,
  }))

  return NextResponse.json(daily)
}
