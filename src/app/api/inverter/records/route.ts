import { NextRequest, NextResponse } from "next/server"
import { generateDayRecords } from "@/lib/inverter-mock"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date")
  const date = dateParam ? new Date(dateParam) : new Date()
  return NextResponse.json(generateDayRecords(date))
}
