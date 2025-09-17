import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET: list regular users (exclude password)
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
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(Array.isArray(users) ? users : [])
  } catch (err) {
    console.error('GET /api/users error', err)
    return NextResponse.json([], { status: 500 })
  }
}

// POST: create a new regular user { email, password, name?, phone?, address? }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !body.email || !body.password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 })
    }

    const email = String(body.email).trim()
    const password = String(body.password)
    const name = body.name ? String(body.name).trim() : null
    const phone = body.phone ? String(body.phone).trim() : null
    const address = body.address ? String(body.address).trim() : null

    // ensure uniqueness by email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'email_taken' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const created = await prisma.user.create({
      data: { 
        email, 
        password: hashed, 
        name, 
        phone, 
        address 
      }
    })

    // return created user (exclude password)
    const { id, createdAt, updatedAt } = created
    return NextResponse.json({ 
      id, 
      email, 
      name, 
      phone, 
      address, 
      createdAt, 
      updatedAt 
    })
  } catch (err) {
    console.error('POST /api/users error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

// PATCH: update user password { email, password }
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !body.email || !body.password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 })
    }

    const email = String(body.email).trim()
    const password = String(body.password)

    const hashed = await bcrypt.hash(password, 10)
    const updated = await prisma.user.update({
      where: { email },
      data: { password: hashed }
    })

    return NextResponse.json({ message: 'password updated' })
  } catch (err) {
    console.error('PATCH /api/users error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

// DELETE: delete user by email
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }

    await prisma.user.delete({ where: { email } })
    return NextResponse.json({ message: 'user deleted' })
  } catch (err) {
    console.error('DELETE /api/users error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}