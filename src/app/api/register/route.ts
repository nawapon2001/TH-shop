import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const existing = await prisma.user.findUnique({
      where: { email }
    })
    if (existing) {
      return NextResponse.json({ message: 'Email นี้ถูกใช้งานแล้ว' }, { status: 400 })
    }

    await prisma.user.create({
      data: { email, password }
    })

    return NextResponse.json({ message: 'สมัครสมาชิกสำเร็จ' })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
