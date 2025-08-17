import { NextResponse } from 'next/server'
import { connectToDatabase } from '../../../lib/mongodb'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 })
  }

  await connectToDatabase()
  const User = (await import('../../../models/User')).default
  const user = await User.findOne({ email })

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
      fullName: user.fullName,
      memberType: user.memberType
    }
  })
}
