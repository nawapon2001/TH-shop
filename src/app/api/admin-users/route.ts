import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET: list admin users (exclude password)
export async function GET() {
  try {
    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
    return NextResponse.json(Array.isArray(users) ? users : [])
  } catch (err) {
    console.error('GET /api/admin-users error', err)
    return NextResponse.json([], { status: 500 })
  }
}

// POST: create a new admin user { username, password, email? }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !body.username || !body.password) return NextResponse.json({ error: 'username and password required' }, { status: 400 })

    const username = String(body.username).trim()
    const password = String(body.password)
    const email = body.email ? String(body.email).trim() : `${username}@local`

    // ensure uniqueness by username/email
    const existing = await prisma.adminUser.findFirst({ where: { OR: [{ username }, { email }] } })
    if (existing) return NextResponse.json({ error: 'username_or_email_taken' }, { status: 409 })

    const hashed = await bcrypt.hash(password, 10)
    const created = await prisma.adminUser.create({
      data: { username, email, password: hashed }
    })
    // return created user (exclude password)
    const { id, role, isActive, createdAt, updatedAt } = created
    return NextResponse.json({ id, username, email, role, isActive, createdAt, updatedAt })
  } catch (err) {
    console.error('POST /api/admin-users error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

// DELETE /api/admin-users?email=... or ?username=...
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    const username = url.searchParams.get('username')
    if (!email && !username) return NextResponse.json({ error: 'email or username required' }, { status: 400 })

    if (email) {
      await prisma.adminUser.delete({ where: { email } })
    } else if (username) {
      await prisma.adminUser.delete({ where: { username } })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin-users error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

// PATCH /api/admin-users with body { email or username, password }
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || (!body.email && !body.username) || !body.password) return NextResponse.json({ error: 'identifier and password required' }, { status: 400 })

    const hashed = await bcrypt.hash(String(body.password), 10)
    if (body.email) {
      await prisma.adminUser.update({ where: { email: String(body.email) }, data: { password: hashed } })
    } else {
      await prisma.adminUser.update({ where: { username: String(body.username) }, data: { password: hashed } })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/admin-users error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
