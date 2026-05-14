import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function n(v: unknown): number {
  const x = parseFloat(String(v ?? 0).replace(",", "."))
  return isNaN(x) ? 0 : x
}

// Extract UTC hour (0–23) from "YYYY-MM-DD HH:mm:ss DST" string
function parseHour(raw: unknown): number | null {
  const m = String(raw).match(/[T ](\d{2}):\d{2}:\d{2}/)
  if (!m) return null
  const h = parseInt(m[1], 10)
  return h >= 0 && h <= 23 ? h : null
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get("file") as File | null
  const dateParam = form.get("date") as string | null

  if (!file) return NextResponse.json({ error: "Файл не знайдено" }, { status: 400 })
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json({ error: "Вкажіть дату звіту" }, { status: 400 })
  }

  const buffer = new Uint8Array(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: "array", cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]

  // FusionSolar XLSX sets !ref to start after the first few rows due to SharedStrings
  // corruption — force the range to cover from row 0 so no hourly rows are skipped.
  if (ws["!ref"]) {
    const r = XLSX.utils.decode_range(ws["!ref"])
    r.s.r = 0
    r.s.c = 0
    ws["!ref"] = XLSX.utils.encode_range(r)
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" })

  // Row 0 = report header, row 1 = column names, data from row 2.
  // Timestamps in column A may be empty for early rows (SharedStrings corruption);
  // we recover the hour via anchor-relative index (see below).
  const rawDataRows = rows.slice(2, 26)
  if (rawDataRows.length === 0) {
    return NextResponse.json({ error: "Не знайдено рядків даних" }, { status: 400 })
  }

  const baseMidnight = new Date(dateParam + "T00:00:00.000Z")

  type Record = {
    timestamp: Date; statisticalPeriod: string
    globalIrradiation: number; avgTemperature: number; theoreticalYield: number
    pvYield: number; inverterYield: number; export: number; import: number
    lossExportKwh: number; lossExportEur: number; charge: number; discharge: number; revenue: number
  }

  // Find anchor: first row with a parseable hour, used to infer hours for rows
  // whose column A is empty due to SharedStrings corruption.
  let anchorHour = -1
  let anchorIdx = -1
  for (let i = 0; i < rawDataRows.length; i++) {
    const row = Array.isArray(rawDataRows[i]) ? (rawDataRows[i] as unknown[]) : []
    const h = parseHour(row[0])
    if (h !== null) { anchorHour = h; anchorIdx = i; break }
  }

  const recordsByHour = new Map<number, Record>()

  for (let i = 0; i < rawDataRows.length; i++) {
    const row = Array.isArray(rawDataRows[i]) ? (rawDataRows[i] as unknown[]) : []
    let hour = parseHour(row[0])
    // Recover hour for rows with corrupted/missing timestamp using the anchor
    if (hour === null && anchorIdx >= 0) {
      hour = anchorHour - (anchorIdx - i)
      if (hour < 0 || hour > 23) continue
    }
    if (hour === null) continue
    const timestamp = new Date(baseMidnight.getTime() + hour * 3_600_000)
    recordsByHour.set(hour, {
      timestamp,
      statisticalPeriod: `${String(hour).padStart(2, "0")}:00`,
      globalIrradiation: n(row[1]),
      avgTemperature:    n(row[2]),
      theoreticalYield:  n(row[3]),
      pvYield:           n(row[4]),
      inverterYield:     n(row[5]),
      export:            n(row[6]),
      import:            n(row[7]),
      lossExportKwh:     n(row[8]),
      lossExportEur:     n(row[9]),
      charge:            n(row[10]),
      discharge:         n(row[11]),
      revenue:           0,
    })
  }

  const records = Array.from(recordsByHour.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  const dayEnd = new Date(baseMidnight.getTime() + 24 * 3_600_000)

  await prisma.$transaction(async (tx) => {
    await tx.inverterRecord.deleteMany({
      where: { timestamp: { gte: baseMidnight, lt: dayEnd } },
    })
    await tx.inverterRecord.createMany({ data: records })
  })

  return NextResponse.json({ imported: records.length, date: dateParam })
}
