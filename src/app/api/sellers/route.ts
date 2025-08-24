import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'

function serialize(doc: any) {
  if (!doc) return null
  const { password, _id, ...rest } = doc
  return { _id: _id ? String(_id) : undefined, ...rest }
}

export async function GET(req: Request) {
  try {
    const client = await clientPromise
    if (!client) return NextResponse.json([], { status: 200 })
    const db = (client as any).db()
    const sellers = await db.collection('sellers').find({}).toArray()
    return NextResponse.json(sellers.map(serialize))
  } catch (err) {
    console.error('GET /api/sellers error', err)
    return NextResponse.json([], { status: 200 })
  }
}
