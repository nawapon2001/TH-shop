import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  try {
    await connectToDatabase()
  const users = await User.find({}).select('-__v -password').lean()
    return NextResponse.json(Array.isArray(users) ? users : [])
  } catch (err) {
    console.error('GET /api/admin-users error', err)
    return NextResponse.json([], { status: 500 })
  }
}

// DELETE /api/admin-users?email=...
export async function DELETE(req: Request) {
  try {
    await connectToDatabase()
    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  await User.deleteOne({ email })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin-users error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

// PATCH /api/admin-users with body { email, password }
export async function PATCH(req: Request) {
  try {
    await connectToDatabase()
    const body = await req.json().catch(()=>null)
    if (!body || !body.email || !body.password) return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  // update password directly (keeps existing plain/hash behavior)
  await User.updateOne({ email: body.email }, { $set: { password: body.password } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/admin-users error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
