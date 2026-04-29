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

  const records = await prisma.inverterRecord.findMany({
    where: { timestamp: { gte: dayStart, lte: dayEnd } },
    orderBy: { timestamp: "asc" },
    select: {
      statisticalPeriod: true,
      pvYield:           true,
      inverterYield:     true,
      export:            true,
      import:            true,
      revenue:           true,
    },
  })

  return NextResponse.json(records)
}
