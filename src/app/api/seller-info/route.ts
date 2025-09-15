import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

type SellerInfo = {
  username: string
  fullName?: string
  email?: string
  phone?: string
  shopName?: string
  description?: string
  birthDate?: string
  province?: string
  address?: string
  image?: string
  shopImage?: string
  bankAccount?: string
  bankName?: string
  accountHolderName?: string
  _id?: string
}

function serializeId<T extends Record<string, any>>(doc: T | null) {
  if (!doc) return null
  const { _id, ...rest } = doc as any
  return _id ? { _id: String(_id), ...rest } : rest
}

/* GET /api/seller-info?username=... */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username')
    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 })
    }

  const client = await clientPromise
  if (!client) return NextResponse.json({ error: 'database not configured' }, { status: 500 })
  // client is a MongoClient
  const db = (client as any).db()
    const seller = await db.collection('sellers').findOne({ username })

    if (!seller) return NextResponse.json(null, { status: 404 })
    return NextResponse.json(serializeId(seller))
  } catch (err) {
    console.error('GET /api/seller-info error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

/* POST create seller (body must include username) */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SellerInfo
    if (!body?.username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 })
    }

  const client = await clientPromise
  if (!client) return NextResponse.json({ error: 'database not configured' }, { status: 500 })
  const db = (client as any).db()

    // ensure unique username
    await db.collection('sellers').createIndex({ username: 1 }, { unique: true })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...bodyWithoutId } = body
    const seller = { ...bodyWithoutId, createdAt: new Date(), updatedAt: new Date() }
    const result = await db.collection('sellers').insertOne(seller)
    return NextResponse.json({ ...seller, _id: result.insertedId.toString() }, { status: 201 })
  } catch (err: any) {
    // duplicate key
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'username already exists' }, { status: 409 })
    }
    console.error('POST /api/seller-info error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

/* PUT update seller (body must include username) */
export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as SellerInfo
    if (!body?.username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 })
    }

  const client = await clientPromise
  if (!client) return NextResponse.json({ error: 'database not configured' }, { status: 500 })
  const db = (client as any).db()

    const filter = { username: body.username }
    const update = { $set: { ...body, updatedAt: new Date() } }
    const opts = { upsert: true }
    await db.collection('sellers').updateOne(filter, update, opts)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PUT /api/seller-info error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

/* DELETE remove seller (accept username in query or body) */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const fromQuery = url.searchParams.get('username')
    let fromBody: string | undefined
    try {
      const b = await req.json()
      fromBody = b?.username
    } catch {
      // no body / not JSON — ignore
    }
    const username = fromQuery || fromBody
    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 })
    }

  const client = await clientPromise
  if (!client) return NextResponse.json({ error: 'database not configured' }, { status: 500 })
  const db = (client as any).db()

    await db.collection('sellers').deleteOne({ username })
    // optionally delete related products
    await db.collection('seller_products').deleteMany({ username })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/seller-info error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
