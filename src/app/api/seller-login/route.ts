import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = body
    if (!username || !password) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 })
    }

    const seller = await prisma.seller.findUnique({
      where: { username }
    })
    
    if (!seller) {
      return NextResponse.json({ message: 'ไม่พบผู้ใช้' }, { status: 401 })
    }

    const match = await bcrypt.compare(password, seller.password || '')
    if (!match) {
      return NextResponse.json({ message: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    return NextResponse.json({ 
      message: 'เข้าสู่ระบบสำเร็จ', 
      seller: {
        id: seller.id,
        username: seller.username,
        shopName: seller.shopName,
        email: seller.email
      }
    })

  } catch (err) {
    console.error('Seller login error:', err)
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 })
  }
}
