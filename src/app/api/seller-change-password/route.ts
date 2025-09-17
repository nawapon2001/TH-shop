import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
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

    // Try seller first, then user
    const seller = await prisma.seller.findUnique({ where: { username } })
    let user = null
    if (!seller) {
      user = await prisma.user.findUnique({ where: { username } })
    }

    if (!seller && !user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้ในระบบ' }, { status: 404 })
    }

    // Determine stored password
    const storedHash = seller ? seller.password : (user as any).password
    const isValidPassword = await bcrypt.compare(currentPassword, storedHash || '')
    if (!isValidPassword) {
      return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 401 })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    if (seller) {
      await prisma.seller.update({ where: { username }, data: { password: hashedNewPassword } })
    } else if (user) {
      await prisma.user.update({ where: { username }, data: { password: hashedNewPassword } })
    }

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
