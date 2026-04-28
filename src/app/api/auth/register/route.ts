import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, organization } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Всі поля обов'язкові" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Користувач з таким email вже існує" },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    await prisma.user.create({
      data: { name, email, password: hashedPassword, organization },
    })

    return NextResponse.json(
      { message: "Реєстрація успішна" },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Помилка сервера" },
      { status: 500 }
    )
  }
}