import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET /api/rdn?date=YYYY-MM-DD  →  { prices: number[24] } (грн/МВт·год, індекс = година 0–23)
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date")
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 })

  const dayStart = new Date(date + "T00:00:00.000Z")
  const dayEnd   = new Date(date + "T23:59:59.999Z")

  const rows = await prisma.rdnPrice.findMany({
    where: { date: { gte: dayStart, lte: dayEnd } },
    orderBy: { hour: "asc" },
    select: { hour: true, price: true },
  })

  const prices = Array<number>(24).fill(0)
  for (const r of rows) prices[r.hour] = r.price

  return NextResponse.json({ prices })
}

// POST /api/rdn  body: { records: { date: "YYYY-MM-DD", hour: 0-23, price: number }[] }
export async function POST(req: NextRequest) {
  const body = await req.json() as { records: { date: string; hour: number; price: number }[] }

  if (!Array.isArray(body.records) || body.records.length === 0)
    return NextResponse.json({ error: "records array required" }, { status: 400 })

  const data = body.records.map(r => ({
    date:  new Date(r.date + "T00:00:00.000Z"),
    hour:  r.hour,
    price: r.price,
  }))

  // upsert кожного запису щоб повторний імпорт перезаписував
  await prisma.$transaction(
    data.map(d =>
      prisma.rdnPrice.upsert({
        where:  { date_hour: { date: d.date, hour: d.hour } },
        update: { price: d.price },
        create: d,
      })
    )
  )

  return NextResponse.json({ imported: data.length })
}
