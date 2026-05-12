import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function parseTimestamp(raw: unknown): Date | null {
  if (!raw) return null
  const s = String(raw).replace(/\s*DST\s*$/i, "").trim()
  const d = new Date(s.replace(" ", "T") + "Z")
  return isNaN(d.getTime()) ? null : d
}

function n(v: unknown): number {
  const x = parseFloat(String(v ?? 0).replace(",", "."))
  return isNaN(x) ? 0 : x
}

async function getBuffer(req: NextRequest): Promise<Uint8Array | null> {
  const ct = req.headers.get("content-type") ?? ""
  if (ct.includes("application/json")) {
    const body = await req.json()
    if (!body?.base64) return null
    const bin = atob(body.base64)
    const buf = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
    return buf
  }
  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file) return null
  return new Uint8Array(await file.arrayBuffer())
}

export async function POST(req: NextRequest) {
  const buffer = await getBuffer(req)
  if (!buffer) return NextResponse.json({ error: "Файл не знайдено" }, { status: 400 })

  const wb = XLSX.read(buffer, { type: "array" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" })

  // Рядок 0 — заголовок звіту, рядок 1 — назви колонок, дані з рядка 2
  type Record = {
    timestamp: Date; statisticalPeriod: string
    globalIrradiation: number; avgTemperature: number; theoreticalYield: number
    pvYield: number; inverterYield: number; export: number; import: number
    lossExportKwh: number; lossExportEur: number; charge: number; discharge: number; revenue: number
  }

  const dataRows = rows.slice(2).filter(r => Array.isArray(r) && r[0])

  const records = dataRows.map((r): Record | null => {
    const row = r as unknown[]
    const timestamp = parseTimestamp(row[0])
    if (!timestamp) return null
    return {
      timestamp,
      statisticalPeriod: timestamp.toISOString().slice(11, 16),
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
    }
  }).filter((r): r is Record => r !== null)

  if (records.length === 0) {
    return NextResponse.json({ error: "Не знайдено рядків даних" }, { status: 400 })
  }

  let imported = 0
  const BATCH = 50
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    await prisma.$transaction(
      batch.map(r =>
        prisma.inverterRecord.upsert({
          where: { timestamp: r.timestamp },
          update: r,
          create: r,
        })
      )
    )
    imported += batch.length
  }

  const date = records[0].timestamp.toISOString().slice(0, 10)
  return NextResponse.json({ imported, date })
}
