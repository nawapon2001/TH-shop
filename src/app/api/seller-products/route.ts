import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

type ProductPayload = {
  username: string
  item?: {
    name: string
    price: number | string
    desc?: string
  image?: string
  images?: string[]
  options?: { name: string; values: string[] }[]
  }
}

/* GET /api/seller-products?username=... */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const username = url.searchParams.get('username')
    const id = url.searchParams.get('id')

    const client = await clientPromise
    if (!client) return NextResponse.json({ error: 'database not configured' }, { status: 500 })
    const db = (client as any).db()

    // GET by id
    if (id) {
      // allow both string ids and ObjectId
      try {
        const doc = await db.collection('seller_products').findOne({ _id: new ObjectId(id) })
  if (!doc) return NextResponse.json(null, { status: 404 })
  // normalize images/options for clients and expose a single 'image' shortcut
  const images = Array.isArray(doc.images) ? doc.images : (doc.image ? [doc.image] : [])
  const options = Array.isArray(doc.options) ? doc.options : []
  const image = images.length ? images[0] : (doc.image || '')
  return NextResponse.json({ ...doc, _id: String(doc._id), images, options, image })
      } catch {
        // fallback: try to find by string id field
        const doc = await db.collection('seller_products').findOne({ _id: id })
  if (!doc) return NextResponse.json(null, { status: 404 })
  const images = Array.isArray((doc as any).images) ? (doc as any).images : ((doc as any).image ? [(doc as any).image] : [])
  const options = Array.isArray((doc as any).options) ? (doc as any).options : []
  const image = images.length ? images[0] : ((doc as any).image || '')
  return NextResponse.json({ ...doc, _id: String((doc as any)._id), images, options, image })
      }
    }

    // GET by username
    if (username) {
      const items = await db.collection('seller_products').find({ username }).toArray()
      const res = items.map((i: any) => {
        const images = Array.isArray(i.images) ? i.images : (i.image ? [i.image] : [])
        return ({
          ...i,
          _id: String(i._id),
          images,
          image: images.length ? images[0] : (i.image || ''),
          options: Array.isArray(i.options) ? i.options : []
        })
      })
      return NextResponse.json(res)
    }

    // no filters -> return all seller products
    const all = await db.collection('seller_products').find({}).toArray()
    const resAll = all.map((i: any) => {
      const images = Array.isArray(i.images) ? i.images : (i.image ? [i.image] : [])
      return ({
        ...i,
        _id: String(i._id),
        images,
        image: images.length ? images[0] : (i.image || ''),
        options: Array.isArray(i.options) ? i.options : []
      })
    })
    return NextResponse.json(resAll)
  } catch (err) {
    console.error('GET /api/seller-products error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

/* POST create product */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProductPayload
    if (!body?.username || !body?.item?.name) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
    }

  const doc = {
      username: body.username,
      name: body.item.name,
      price: typeof body.item.price === 'string' ?
        (Number(body.item.price) || body.item.price) :
        body.item.price,
      desc: body.item.desc || '',
  images: Array.isArray(body.item.images) ? body.item.images : (body.item.image ? [body.item.image] : []),
  image: Array.isArray(body.item.images) && body.item.images.length ? body.item.images[0] : (body.item.image || ''),
      options: Array.isArray(body.item.options) ? body.item.options : [],
      createdAt: new Date()
    }

  const client = await clientPromise
  if (!client) return NextResponse.json({ error: 'database not configured' }, { status: 500 })
  const db = (client as any).db()
    const r = await db.collection('seller_products').insertOne(doc)
    return NextResponse.json({ ok: true, id: String(r.insertedId) })
  } catch (err) {
    console.error('POST /api/seller-products error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

/* DELETE /api/seller-products?id=... */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const client = await clientPromise
  if (!client) return NextResponse.json({ error: 'database not configured' }, { status: 500 })
  const db = (client as any).db()
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 })
    }
    const _id = new ObjectId(id)
    await db.collection('seller_products').deleteOne({ _id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/seller-products error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
