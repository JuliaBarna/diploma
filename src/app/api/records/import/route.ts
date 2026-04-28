import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! })
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { records } = body

  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: "Немає даних для імпорту" }, { status: 400 })
  }

  const data = records.map((r: any) => ({
    userId: token.id as string,
    device: r.device || "Невідомий пристрій",
    location: r.location || null,
    consumption: parseFloat(r.consumption) || 0,
    power: r.power ? parseFloat(r.power) : null,
    recordedAt: new Date(r.recordedAt || r.date || Date.now()),
  }))

  const result = await prisma.energyRecord.createMany({ data })

  return NextResponse.json({ imported: result.count })
}