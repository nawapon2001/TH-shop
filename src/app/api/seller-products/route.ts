import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/mongodb'
import { ObjectId } from 'mongodb'

// GET /api/seller-products?username=...
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const username = url.searchParams.get('username')
    const db = await getDb()
    const coll = db.collection('products')
    if (username) {
      const list = await coll.find({ username }).sort({ createdAt: -1 }).toArray()
      return NextResponse.json(list)
    }
    const all = await coll.find().sort({ createdAt: -1 }).toArray()
    return NextResponse.json(all)
  } catch {
    return NextResponse.json({ message: 'server error' }, { status: 500 })
  }
}

// POST { username, item: { name, price, desc, image } }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const username = body?.username || body?.user
    const item = body?.item
    if (!username || !item || !item.name) {
      return NextResponse.json({ message: 'username and item.name are required' }, { status: 400 })
    }
    const db = await getDb()
    const coll = db.collection('products')
    const newProduct = {
      username,
      name: item.name,
      price: item.price ?? 0,
      desc: item.desc || '',
      image: item.image || '/placeholder.png',
      createdAt: new Date()
    }
    const result = await coll.insertOne(newProduct)
    const inserted = { ...newProduct, _id: result.insertedId.toHexString() }
    return NextResponse.json(inserted, { status: 201 })
  } catch {
    return NextResponse.json({ message: 'server error' }, { status: 500 })
  }
}

// DELETE /api/seller-products?id=...
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    let id = url.searchParams.get('id')
    const db = await getDb()
    const coll = db.collection('products')
    if (!id) {
      const body = await req.json().catch(() => ({}))
      id = body?.id
    }
    if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 })
    // try delete as ObjectId first, fallback to string _id field
    let delRes = null
    try {
      delRes = await coll.deleteOne({ _id: new ObjectId(id) })
    } catch {
      delRes = await coll.deleteOne({ _id: id }).catch(() => null)
    }
    if (!delRes || delRes.deletedCount === 0) return NextResponse.json({ message: 'not found' }, { status: 404 })
    return NextResponse.json({ message: 'deleted' })
  } catch {
    return NextResponse.json({ message: 'server error' }, { status: 500 })
  }
}
    if (!id) {
      // allow body { id }
      const body = await req.json().catch(() => ({}))
      if (body?.id) {
        const idx = db.findIndex((p) => p._id === body.id)
        if (idx === -1) return NextResponse.json({ message: 'not found' }, { status: 404 })
        db.splice(idx, 1)
        await writeDB(db)
        return NextResponse.json({ message: 'deleted' })
      }
      return NextResponse.json({ message: 'id is required' }, { status: 400 })
    }
    const idx = db.findIndex((p) => p._id === id)
    if (idx === -1) return NextResponse.json({ message: 'not found' }, { status: 404 })
    db.splice(idx, 1)
    await writeDB(db)
    return NextResponse.json({ message: 'deleted' })
  } catch (err) {
    return NextResponse.json({ message: 'server error' }, { status: 500 })
  }
}
