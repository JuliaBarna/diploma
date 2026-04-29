import * as XLSX from "xlsx"

const file = process.argv[2]
if (!file) { console.error("Usage: npx tsx prisma/debug-xlsx.ts <file.xlsx>"); process.exit(1) }

const wb = XLSX.readFile(file)
console.log("Sheet names:", wb.SheetNames)
const ws = wb.Sheets[wb.SheetNames[0]]
const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" })
console.log("Total rows:", rows.length)
console.log("Keys:", Object.keys(rows[0] ?? {}))
console.log("Row 0:", rows[0])
console.log("Row 1:", rows[1])
