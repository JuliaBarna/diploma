/**
 * Reads hourly FusionSolar .xlsx files and upserts records into the DB.
 * Usage: npx tsx prisma/import-xlsx.ts <path-to-file-or-folder>
 *
 * File name must be a date: 14-04-2026.xlsx
 * Row 0 in parsed output = header labels (skipped).
 * Rows 1-24 = hourly data with __EMPTY_N keys.
 * Statistical period format: "2026-04-01 13:00:00 DST"
 * Numbers use European format: comma as decimal, space as thousands.
 */

import * as XLSX from "xlsx"
import * as path from "path"
import * as fs from "fs"
import { config } from "dotenv"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"

// Load .env before anything uses DATABASE_URL
config({ path: path.resolve(process.cwd(), ".env") })

neonConfig.webSocketConstructor = ws

function getPrisma() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set in .env")
  const adapter = new PrismaNeon({ connectionString: url })
  return new PrismaClient({ adapter })
}

function parseNum(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0
  const s = String(val).replace(/\s/g, "").replace(",", ".")
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

function parseDateFromFilename(filename: string): Date | null {
  const m = path.basename(filename).match(/^(\d{2})-(\d{2})-(\d{4})\.xlsx$/i)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`)
}

function parseHourFromPeriod(period: string): number {
  // "2026-04-01 13:00:00 DST" → 13
  const m = String(period).match(/\s(\d{2}):\d{2}:\d{2}/)
  return m ? parseInt(m[1], 10) : 0
}

function formatPeriod(period: string): string {
  // "2026-04-01 13:00:00 DST" → "13:00"
  const m = String(period).match(/\s(\d{2}:\d{2}):\d{2}/)
  return m ? m[1] : period
}

async function importFile(prisma: PrismaClient, filePath: string) {
  const fileDate = parseDateFromFilename(filePath)
  if (!fileDate) {
    console.error(`Skipping ${filePath}: filename must be DD-MM-YYYY.xlsx`)
    return
  }

  const wb = XLSX.readFile(filePath)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" })

  // Row 0 is the header row — skip it
  const dataRows = rows.slice(1)

  let inserted = 0
  for (const row of dataRows) {
    const rawPeriod = String(row["__EMPTY"] ?? "")
    if (!rawPeriod) continue

    const hour = parseHourFromPeriod(rawPeriod)
    const period = formatPeriod(rawPeriod)

    const timestamp = new Date(fileDate)
    timestamp.setUTCHours(hour, 0, 0, 0)

    const data = {
      statisticalPeriod: period,
      globalIrradiation: parseNum(row["__EMPTY_1"]),
      avgTemperature:    parseNum(row["__EMPTY_2"]),
      theoreticalYield:  parseNum(row["__EMPTY_3"]),
      pvYield:           parseNum(row["__EMPTY_4"]),
      inverterYield:     parseNum(row["__EMPTY_5"]),
      export:            parseNum(row["__EMPTY_6"]),
      import:            parseNum(row["__EMPTY_7"]),
      lossExportKwh:     parseNum(row["__EMPTY_8"]),
      lossExportEur:     parseNum(row["__EMPTY_9"]),
      charge:            parseNum(row["__EMPTY_10"]),
      discharge:         parseNum(row["__EMPTY_11"]),
      revenue:           parseNum(row["__EMPTY_12"]),
    }

    await prisma.inverterRecord.upsert({
      where: { timestamp },
      update: data,
      create: { timestamp, ...data },
    })
    inserted++
  }

  console.log(`${path.basename(filePath)}: ${inserted} records imported`)
}

async function main() {
  const target = process.argv[2]
  if (!target) {
    console.error("Usage: npx tsx prisma/import-xlsx.ts <file.xlsx | folder>")
    process.exit(1)
  }

  const prisma = getPrisma()

  const stat = fs.statSync(target)
  if (stat.isDirectory()) {
    const files = fs.readdirSync(target)
      .filter((f) => /^\d{2}-\d{2}-\d{4}\.xlsx$/i.test(f))
      .sort()
    for (const f of files) await importFile(prisma, path.join(target, f))
  } else {
    await importFile(prisma, target)
  }

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
