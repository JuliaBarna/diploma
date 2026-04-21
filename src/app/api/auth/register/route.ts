import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, createToken } from "@/lib/auth"

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

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, organization },
    })

    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json(
      { message: "Реєстрація успішна" },
      { status: 201 }
    )

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: "Помилка сервера" },
      { status: 500 }
    )
  }
}