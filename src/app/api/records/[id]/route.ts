import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! })
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const record = await prisma.energyRecord.findUnique({ where: { id } })
  if (!record || record.userId !== token.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.energyRecord.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! })
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const record = await prisma.energyRecord.findUnique({ where: { id } })
  if (!record || record.userId !== token.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const updated = await prisma.energyRecord.update({
    where: { id },
    data: {
      device: body.device ?? record.device,
      location: body.location ?? record.location,
      consumption: body.consumption ? parseFloat(body.consumption) : record.consumption,
      power: body.power ? parseFloat(body.power) : record.power,
      recordedAt: body.recordedAt ? new Date(body.recordedAt) : record.recordedAt,
    },
  })

  return NextResponse.json(updated)
}
