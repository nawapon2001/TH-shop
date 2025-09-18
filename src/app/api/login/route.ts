import { NextResponse } from 'next/server'
import prisma from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 })
    }

    // Using Prisma client (singleton exported from src/lib/mongodb.ts)
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ message: 'ไม่พบผู้ใช้งานนี้' }, { status: 401 })
    }

    // ตรวจสอบว่ารหัสผ่านในฐานข้อมูลถูก hash หรือไม่
    let isMatch = false;
    if (user.password && user.password.startsWith('$2a$')) {
      // เป็น bcrypt hash
      isMatch = await bcrypt.compare(password, user.password)
    } else {
      // เป็น plain text (ไม่ควรใช้ใน production)
      isMatch = password === user.password
    }

    if (!isMatch) {
      return NextResponse.json({ message: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    // ส่งข้อมูลผู้ใช้กลับ (ยกเว้นรหัสผ่าน)
    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name || null
      }
    })
  } catch (err: any) {
    // Log the error on server for debugging and return a helpful message
    console.error('Login API error:', err)
    const msg = err?.message || String(err)
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดระหว่างล็อกอิน', error: msg }, { status: 500 })
  }
}
