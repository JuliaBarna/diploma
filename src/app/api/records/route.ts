import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! })
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const records = await prisma.energyRecord.findMany({
    where: { userId: token.id as string },
    orderBy: { recordedAt: "desc" },
  })

  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! })
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { device, location, consumption, power, recordedAt } = body

  if (!device || !consumption || !recordedAt) {
    return NextResponse.json({ error: "Обов'язкові поля: device, consumption, recordedAt" }, { status: 400 })
  }

  const record = await prisma.energyRecord.create({
    data: {
      userId: token.id as string,
      device,
      location: location || null,
      consumption: parseFloat(consumption),
      power: power ? parseFloat(power) : null,
      recordedAt: new Date(recordedAt),
    },
  })

  return NextResponse.json(record, { status: 201 })
}