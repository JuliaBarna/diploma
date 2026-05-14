import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function n(v: unknown): number {
  const x = parseFloat(String(v ?? 0).replace(/\s/g, "").replace(",", "."))
  return isNaN(x) ? 0 : x
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file  = form.get("file")  as File   | null
  const month = form.get("month") as string | null  // "YYYY-MM"

  if (!file)  return NextResponse.json({ error: "Файл не знайдено" }, { status: 400 })
  if (!month || !/^\d{4}-\d{2}$/.test(month))
    return NextResponse.json({ error: "Вкажіть місяць (YYYY-MM)" }, { status: 400 })

  const buffer = new Uint8Array(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: "array" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" })

  // Row 0 = title, row 1 = hour headers (1–24), row 2 = unit label, data from row 3.
  // Col A = day number, cols B–Y (index 1–24) = prices for hours 1–24.
  // Store hour as 0-indexed (hour_excel - 1) to match getUTCHours() in revenue calc.
  const dataRows = rows.slice(3)

  const records: { date: Date; hour: number; price: number }[] = []

  for (const r of dataRows) {
    const row = Array.isArray(r) ? (r as unknown[]) : []
    const day = parseInt(String(row[0]), 10)
    if (isNaN(day) || day < 1 || day > 31) continue

    const dateStr = `${month}-${String(day).padStart(2, "0")}`
    const date = new Date(dateStr + "T00:00:00.000Z")

    for (let col = 1; col <= 24; col++) {
      const price = Math.round(n(row[col]))
      records.push({ date, hour: col % 24, price })  // col 1→hour 1, col 24→hour 0
    }
  }

  if (records.length === 0)
    return NextResponse.json({ error: "Не знайдено даних у файлі" }, { status: 400 })

  const monthStart = new Date(month + "-01T00:00:00.000Z")
  const monthEnd   = new Date(
    new Date(monthStart).setMonth(monthStart.getMonth() + 1)
  )

  await prisma.$transaction(async (tx) => {
    await tx.rdnPrice.deleteMany({
      where: { date: { gte: monthStart, lt: monthEnd } },
    })
    await tx.rdnPrice.createMany({ data: records })
  })

  return NextResponse.json({ imported: records.length, month })
}
