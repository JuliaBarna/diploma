/**
 * Reads hourly FusionSolar .xlsx files and upserts records into the DB.
 * Usage: npx tsx prisma/import-xlsx.ts <path-to-file-or-folder>
 *
 * File name must be a date: 14-04-2026.xlsx
 * Each file has 24 rows (one per hour), columns as exported by FusionSolar.
 */

import * as XLSX from "xlsx"
import * as path from "path"
import * as fs from "fs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function parseEU(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0
  const s = String(val).replace(/\s/g, "").replace(",", ".")
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

function parseDateFromFilename(filename: string): Date | null {
  // expects DD-MM-YYYY.xlsx
  const m = path.basename(filename).match(/^(\d{2})-(\d{2})-(\d{4})\.xlsx$/i)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`)
}

function parseTimeToHour(period: string): number {
  // "10:00" → 10
  const m = String(period).match(/^(\d{1,2})/)
  return m ? parseInt(m[1], 10) : 0
}

async function importFile(filePath: string) {
  const fileDate = parseDateFromFilename(filePath)
  if (!fileDate) {
    console.error(`Skipping ${filePath}: filename must be DD-MM-YYYY.xlsx`)
    return
  }

  const wb = XLSX.readFile(filePath)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" })

  let inserted = 0
  for (const row of rows) {
    const period = String(row["Statistical period"] ?? row["Статистичний період"] ?? "")
    if (!period) continue

    const hour = parseTimeToHour(period)
    const timestamp = new Date(fileDate)
    timestamp.setUTCHours(hour, 0, 0, 0)

    await prisma.inverterRecord.upsert({
      where: { timestamp },
      update: {},
      create: {
        timestamp,
        statisticalPeriod: period,
        globalIrradiation: parseEU(row["Global irradiation"] ?? row["Глобальне опромінення"]),
        avgTemperature:    parseEU(row["Average temperature"] ?? row["Сер. температура"]),
        theoreticalYield:  parseEU(row["Theoretical yield"] ?? row["Теоретичне вироблення"]),
        pvYield:           parseEU(row["PV yield"] ?? row["Вироблення PV"]),
        inverterYield:     parseEU(row["Inverter yield"] ?? row["Вироблення інвертора"]),
        export:            parseEU(row["Export"] ?? row["Експорт"]),
        import:            parseEU(row["Import"] ?? row["Імпорт"]),
        lossExportKwh:     parseEU(row["Export power limitation loss(kwh)"] ?? row["Втрати експорту"]),
        lossExportEur:     parseEU(row["Export power limitation loss(EUR)"] ?? row["Втрати €"]),
        charge:            parseEU(row["Charge"] ?? row["Заряд"]),
        discharge:         parseEU(row["Discharge"] ?? row["Розряд"]),
        revenue:           parseEU(row["Revenue"] ?? row["Дохід"]),
      },
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

  const stat = fs.statSync(target)
  if (stat.isDirectory()) {
    const files = fs.readdirSync(target).filter((f) => f.endsWith(".xlsx"))
    for (const f of files) await importFile(path.join(target, f))
  } else {
    await importFile(target)
  }

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
