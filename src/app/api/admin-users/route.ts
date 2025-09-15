import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' } // เรียงจากผู้ใช้ที่สมัครใหม่สุด
    });
    
    return NextResponse.json(Array.isArray(users) ? users : [])
  } catch (error) {
    console.error('GET /api/admin-users error', error)
    return NextResponse.json([], { status: 500 })
  }
}

// DELETE /api/admin-users?email=...
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }
    
    await prisma.user.delete({
      where: { email }
    });
    
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DELETE /api/admin-users error', error)
    if (error.code === 'P2025') { // Record not found
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

// PATCH /api/admin-users with body { email, password }
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    
    if (!body || !body.email || !body.password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 })
    }
    
    // Hash the password if it's not already hashed
    let hashedPassword = body.password;
    if (!body.password.startsWith('$2a$')) {
      hashedPassword = await bcrypt.hash(body.password, 12)
    }
    
    await prisma.user.update({
      where: { email: body.email },
      data: { password: hashedPassword }
    });
    
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('PATCH /api/admin-users error', error)
    if (error.code === 'P2025') { // Record not found
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
