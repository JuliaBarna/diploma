import { NextResponse } from "next/server"
import { generateLiveStats } from "@/lib/inverter-mock"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(generateLiveStats(new Date()))
}
