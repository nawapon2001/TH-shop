import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { username, currentPassword, newPassword } = await req.json()
    
    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' }, 
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, 
        { status: 400 }
      )
    }

    const client = await clientPromise
    if (!client) {
      return NextResponse.json(
        { error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' }, 
        { status: 500 }
      )
    }

    const db = (client as any).db()
    
    // Find user in both collections
    let user = await db.collection('sellers').findOne({ username })
    let collection = 'sellers'
    
    if (!user) {
      user = await db.collection('users').findOne({ username })
      collection = 'users'
    }

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้ในระบบ' }, 
        { status: 404 }
      )
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, 
        { status: 401 }
      )
    }

    // Hash new password
    const saltRounds = 10
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await db.collection(collection).updateOne(
      { username },
      { 
        $set: { 
          password: hashedNewPassword,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ 
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ' 
    })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' }, 
      { status: 500 }
    )
  }
}
