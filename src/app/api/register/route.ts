import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { email, password, name, phone, address } = await req.json()

    // Enhanced validation
    if (!email || !password) {
      return NextResponse.json({ message: 'กรุณาระบุอีเมลและรหัสผ่าน' }, { status: 400 })
    }

    // Validate email format with more comprehensive regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 })
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 })
    }

    // Validate email length for MySQL VARCHAR(191) with utf8mb4
    if (email.length > 191) {
      return NextResponse.json({ message: 'อีเมลยาวเกินไป' }, { status: 400 })
    }

    // Validate name length if provided
    if (name && name.length > 100) {
      return NextResponse.json({ message: 'ชื่อยาวเกินไป' }, { status: 400 })
    }

    // Check if email already exists (case-insensitive for MySQL)
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase()
      }
    })

    if (existingUser) {
      return NextResponse.json({ message: 'Email นี้ถูกใช้งานแล้ว' }, { status: 400 })
    }

    // Hash password with salt rounds 12 for better security
    let hashedPassword = ''
    try {
      hashedPassword = await bcrypt.hash(password, 12)
    } catch (hashError) {
      console.error('Password hashing failed:', hashError)
      return NextResponse.json({ message: 'เข้ารหัสรหัสผ่านไม่สำเร็จ' }, { status: 500 })
    }

    // Create user with normalized email
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null
      }
    })

    // Return success without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ 
      message: 'สมัครสมาชิกสำเร็จ',
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Error in user registration:', error)
    
    // Handle specific MySQL errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        message: 'Email นี้ถูกใช้งานแล้ว'
      }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
