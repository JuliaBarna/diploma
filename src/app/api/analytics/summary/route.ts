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
    select: { pvYield: true, inverterYield: true, export: true, import: true, revenue: true },
  })

  const totalPvYield      = records.reduce((s, r) => s + r.pvYield, 0)
  const totalInverterYield = records.reduce((s, r) => s + r.inverterYield, 0)
  const totalExport       = records.reduce((s, r) => s + r.export, 0)
  const totalImport       = records.reduce((s, r) => s + r.import, 0)
  const totalRevenue      = records.reduce((s, r) => s + r.revenue, 0)
  const efficiency        = totalPvYield > 0 ? (totalInverterYield / totalPvYield) * 100 : 0

  return NextResponse.json({
    totalPvYield,
    totalInverterYield,
    totalExport,
    totalImport,
    totalRevenue,
    efficiency,
    recordCount: records.length,
  })
}
