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

    // ค้นหา seller ด้วย username
    const seller = await prisma.seller.findUnique({
      where: { username }
    });

    if (!seller) {
      return NextResponse.json({ message: 'ไม่พบผู้ใช้' }, { status: 401 })
    }

    if (!seller.password) {
      return NextResponse.json({ message: 'บัญชีนี้ยังไม่ได้ตั้งรหัสผ่าน' }, { status: 401 })
    }

    // ตรวจสอบรหัสผ่าน
    const match = await bcrypt.compare(password, seller.password)
    if (!match) {
      return NextResponse.json({ message: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    // ส่งข้อมูลผู้ขาย (ไม่รวมรหัสผ่าน) และคืน token แบบเดโม
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeSeller } = seller
    const token = Math.random().toString(36).slice(2) // demo token; replace with real JWT if needed

    // หากไม่มีข้อมูลหน้าร้าน/ชื่อร้าน ให้แจ้ง client ว่าต้องไปหน้าเปิดร้าน
    const needsProfile = !(safeSeller.shopName || safeSeller.fullName)
    
    return NextResponse.json({ 
      ok: true, 
      seller: safeSeller, 
      token, 
      needsProfile 
    })
  } catch (error) {
    console.error('Seller login error:', error)
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }, { status: 500 })
  }
}
