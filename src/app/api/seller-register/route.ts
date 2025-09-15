import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      username, password, fullName, email, phone,
      shopName, birthDate, province, address
    } = body

    // Basic validation
    if (!username || !password || !fullName || !email || !phone || !shopName || !birthDate || !province || !address) {
      return NextResponse.json({ message: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
    }

    // Check for duplicate username
    const existingUsername = await prisma.seller.findUnique({
      where: { username }
    })

    if (existingUsername) {
      return NextResponse.json({ message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' }, { status: 409 })
    }

    // Check for duplicate email
    if (email) {
      const existingEmail = await prisma.seller.findUnique({
        where: { email }
      })

      if (existingEmail) {
        return NextResponse.json({ message: 'อีเมลนี้ถูกใช้แล้ว' }, { status: 409 })
      }
    }

    // Check for duplicate shop name
    if (shopName) {
      const existingShop = await prisma.seller.findFirst({
        where: { shopName }
      })

      if (existingShop) {
        return NextResponse.json({ message: 'ชื่อร้านนี้ถูกใช้แล้ว' }, { status: 409 })
      }
    }

    // Hash password
    let hashedPassword = ''
    try {
      hashedPassword = await bcrypt.hash(password, 10)
    } catch {
      return NextResponse.json({ message: 'เข้ารหัสรหัสผ่านไม่สำเร็จ' }, { status: 500 })
    }

    // Create seller
    try {
      const seller = await prisma.seller.create({
        data: {
          username,
          password: hashedPassword,
          fullName,
          email,
          phone,
          shopName,
          birthDate,
          province,
          address
        }
      })

      // Return success without password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...sellerWithoutPassword } = seller
      
      return NextResponse.json({ 
        ok: true, 
        message: 'สมัครสมาชิกสำเร็จ',
        seller: sellerWithoutPassword
      })
    } catch (error) {
      console.error('Error creating seller:', error)
      return NextResponse.json({ message: 'บันทึกข้อมูลไม่สำเร็จ' }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in seller registration:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการสมัคร',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
