import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    
    // Enhanced validation
    if (!email || !password) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 })
    }

    // Find user with normalized email (case-insensitive for MySQL)
    const user = await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase()
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    // Verify password with bcrypt
    let isMatch = false;
    
    if (user.password) {
      // Check if password is bcrypt hashed (supports $2a$, $2b$, $2y$)
      const bcryptHashRegex = /^\$2[aby]\$\d+\$/
      
      if (bcryptHashRegex.test(user.password)) {
        // Use bcrypt comparison for hashed passwords
        isMatch = await bcrypt.compare(password, user.password)
      } else {
        // Fallback for legacy plain text passwords (should be migrated)
        isMatch = password === user.password
        
        // Log warning for plain text passwords in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Warning: Plain text password detected for user:', email)
        }
      }
    }

    if (!isMatch) {
      return NextResponse.json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    // Return user data without password
    return NextResponse.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    
    // Handle specific database errors
    if (error instanceof Error && error.message.includes('connection')) {
      return NextResponse.json({ 
        message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' 
      }, { status: 503 })
    }

    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
