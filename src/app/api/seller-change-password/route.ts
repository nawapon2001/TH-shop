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

    // Find user in sellers table first
    const seller = await prisma.seller.findUnique({
      where: { username }
    });
    
    if (seller && seller.password) {
      // Verify current password for seller
      const isValidPassword = await bcrypt.compare(currentPassword, seller.password)
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, 
          { status: 401 }
        )
      }

      // Hash new password
      const saltRounds = 10
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

      // Update seller password
      await prisma.seller.update({
        where: { username },
        data: { 
          password: hashedNewPassword,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({ 
        success: true,
        message: 'เปลี่ยนรหัสผ่านสำเร็จ' 
      })
    }

    // If not found in sellers, try users table
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: username }, // email as username
          { name: username }   // name as username
        ]
      }
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้ในระบบหรือไม่มีรหัสผ่าน' }, 
        { status: 404 }
      )
    }

    // Verify current password for user
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

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

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
