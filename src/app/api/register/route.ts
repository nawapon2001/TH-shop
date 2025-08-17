import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    await connectToDatabase()
    const { email, password } = await req.json()

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ message: 'Email นี้ถูกใช้งานแล้ว' }, { status: 400 })
    }

    const user = new User({ email, password })
    await user.save()

    return NextResponse.json({ message: 'สมัครสมาชิกสำเร็จ' })
  } catch (err) {
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
