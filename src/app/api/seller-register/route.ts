import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password, fullName, email, phone, shopName, birthDate, province, address } = body

    if (!username || !password || !fullName || !email || !phone || !shopName || !birthDate || !province || !address) {
      return NextResponse.json({ message: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
    }

    const exists = await prisma.seller.findFirst({
      where: {
        OR: [{ username }, { email }, { shopName }]
      }
    })
    
    if (exists) {
      return NextResponse.json({ message: 'ชื่อผู้ใช้/อีเมล/ชื่อร้านนี้ถูกใช้แล้ว' }, { status: 409 })
    }

    const seller = await prisma.seller.create({
      data: { username, password, fullName, email, phone, shopName, birthDate, province, address }
    })

    return NextResponse.json({ message: 'สมัครสมาชิกผู้ขายสำเร็จ', sellerId: seller.id })

  } catch (err) {
    console.error('Seller registration error:', err)
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 })
  }
}
