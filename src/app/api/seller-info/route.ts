import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/mongodb'

// GET /api/seller-info?username=...
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const username = url.searchParams.get('username')
    const db = await getDb()
    const coll = db.collection('sellers')
    if (username) {
      const seller = await coll.findOne({ username })
      if (!seller) return NextResponse.json({ message: 'not found' }, { status: 404 })
      return NextResponse.json(seller)
    }
    const all = await coll.find().toArray()
    return NextResponse.json(all)
  } catch (err) {
    return NextResponse.json({ message: 'server error' }, { status: 500 })
  }
}

// POST create new seller
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const username = body?.username || body?.user
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ message: 'username is required' }, { status: 400 })
    }
    const db = await getDb()
    const coll = db.collection('sellers')
    const existing = await coll.findOne({ username })
    if (existing) return NextResponse.json({ message: 'seller already exists' }, { status: 409 })
    const seller = {
      username,
      fullName: body.fullName || body.fullname || '',
      email: body.email || '',
      phone: body.phone || '',
      shopName: body.shopName || '',
      birthDate: body.birthDate || '',
      province: body.province || '',
      address: body.address || '',
      createdAt: new Date()
    }
    await coll.insertOne(seller)
    return NextResponse.json(seller, { status: 201 })
  } catch (err) {
    return NextResponse.json({ message: 'server error' }, { status: 500 })
  }
}

// PUT update seller (body must include username)
export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const username = body?.username
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ message: 'username is required' }, { status: 400 })
    }
    const db = await getDb()
    const coll = db.collection('sellers')
    const res = await coll.findOneAndUpdate(
      { username },
      { $set: body },
      { returnDocument: 'after' }
    )
    if (!res.value) return NextResponse.json({ message: 'not found' }, { status: 404 })
    return NextResponse.json(res.value)
  } catch (err) {
    return NextResponse.json({ message: 'server error' }, { status: 500 })
  }
}

// DELETE remove seller (accept username in query or body)
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    let username = url.searchParams.get('username')
    if (!username) {
      const body = await req.json().catch(() => ({}))
      username = body?.username
    }
    if (!username) return NextResponse.json({ message: 'username is required' }, { status: 400 })
    const db = await getDb()
    const coll = db.collection('sellers')
    const del = await coll.deleteOne({ username })
    if (del.deletedCount === 0) return NextResponse.json({ message: 'not found' }, { status: 404 })
    // cascade delete products for this seller
    await db.collection('products').deleteMany({ username })
    return NextResponse.json({ message: 'deleted' })
  } catch (err) {
    return NextResponse.json({ message: 'server error' }, { status: 500 })
  }
}
export async function DELETE(req: Request) {
	try {
		const url = new URL(req.url)
		let username = url.searchParams.get('username')
		if (!username) {
			const body = await req.json().catch(() => ({}))
			username = body?.username
		}
		if (!username) return NextResponse.json({ message: 'username is required' }, { status: 400 })
		const db = await readDB()
		if (!db[username]) return NextResponse.json({ message: 'not found' }, { status: 404 })
		delete db[username]
		await writeDB(db)
		return NextResponse.json({ message: 'deleted' })
	} catch (err) {
		return NextResponse.json({ message: 'server error' }, { status: 500 })
	}
}
