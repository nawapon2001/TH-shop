import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const user = url.searchParams.get('user')
    if (!user) return NextResponse.json({ wishlist: [] })

    const client = (await clientPromise) as any
    const db = client.db(process.env.DB_NAME || 'signshop')
    const col = db.collection('wishlists')
    const doc = await col.findOne({ user })
    const items = (doc?.items || []).map((i: any) => ({ ...i, id: i.id ?? (i._id ? String(i._id) : undefined) }))
    return NextResponse.json({ wishlist: items })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /api/wishlist error', err)
    return NextResponse.json({ wishlist: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user, item } = body || {}
    if (!user || !item) return NextResponse.json({ ok: false }, { status: 400 })

    // Normalize item to include an `id` string for reliable deletion later
    const normalized = { ...item, id: item.id ?? (item._id ? String(item._id) : undefined) }

    const client = (await clientPromise) as any
    const db = client.db(process.env.DB_NAME || 'signshop')
    const col = db.collection('wishlists')
    await (col as any).updateOne({ user }, { $addToSet: { items: normalized } }, { upsert: true })
    return NextResponse.json({ ok: true })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('POST /api/wishlist error', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const user = url.searchParams.get('user')
    const id = url.searchParams.get('id')
    if (!user || !id) return NextResponse.json({ ok: false }, { status: 400 })

    const client = (await clientPromise) as any
    const db = client.db(process.env.DB_NAME || 'signshop')
    const col = db.collection('wishlists')

    // First, try to remove by normalized `id` field (string)
    const res1 = await (col as any).updateOne({ user }, { $pull: { items: { id } } })
    if (res1?.modifiedCount) return NextResponse.json({ ok: true })

    // Try removing where id was stored as a number (some items use numeric ids)
    const maybeNum = Number(id)
    if (!Number.isNaN(maybeNum)) {
      const resNum = await (col as any).updateOne({ user }, { $pull: { items: { id: maybeNum } } })
      if (resNum?.modifiedCount) return NextResponse.json({ ok: true })
    }

    // If not removed, try matching by _id (string)
    const res2 = await (col as any).updateOne({ user }, { $pull: { items: { _id: id } } })
    if (res2?.modifiedCount) return NextResponse.json({ ok: true })

    // try ObjectId form if id looks like one
    if (ObjectId.isValid(id)) {
      const resObj = await (col as any).updateOne({ user }, { $pull: { items: { _id: new ObjectId(id) } } })
      if (resObj?.modifiedCount) return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false }, { status: 404 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('DELETE /api/wishlist error', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
