import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Order from '@/models/Order'
import { connectToDatabase } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// GET /api/orders[?id=...]
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()
    const id = req.nextUrl.searchParams.get('id')
  const seller = req.nextUrl.searchParams.get('seller')

    if (id) {
      if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ message: 'invalid id' }, { status: 400 })
      }
      const doc = await Order.findById(id).lean()
      if (!doc) return NextResponse.json({ message: 'Order not found' }, { status: 404 })
      return NextResponse.json(doc, { headers: { 'Cache-Control': 'no-store' } })
    }

    // ถ้าระบุ seller ให้คืนเฉพาะคำสั่งซื้อที่มี item.seller เท่ากับค่านั้น
    if (seller) {
      try {
        // find orders where at least one item.seller matches OR item.productId belongs to seller's products
        // first get seller product ids from the raw MongoDB collection (stringified)
        const db = (mongoose.connection && (mongoose.connection as any).db) || null
        let sellerProductIds: string[] = []
        if (db) {
          const sp = await db.collection('seller_products').find({ username: seller }).toArray()
          sellerProductIds = sp.map((s: any) => String(s._id))
        }

        const query: any = {
          $or: [
            { 'items.seller': seller }
          ]
        }
        if (sellerProductIds.length) query.$or.push({ 'items.productId': { $in: sellerProductIds } })

        const docs = await Order.find(query).sort({ createdAt: -1 }).lean()
        return NextResponse.json(docs, { headers: { 'Cache-Control': 'no-store' } })
      } catch (err) {
        console.error('GET /api/orders?seller error', err)
        // fallback to simple seller match
        const docs = await Order.find({ 'items.seller': seller }).sort({ createdAt: -1 }).lean()
        return NextResponse.json(docs, { headers: { 'Cache-Control': 'no-store' } })
      }
    }

    // ทั้งหมด (ใหม่ -> เก่า)
    const docs = await Order.find().sort({ createdAt: -1 }).lean()
    return NextResponse.json(docs, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ message: 'GET error' }, { status: 500 })
  }
}

// POST /api/orders  (ถ้าคุณต้องการ endpoint สร้างออเดอร์)
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    // Support both JSON and multipart FormData (transfer + slip)
    let body: any = {}
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      // NextRequest doesn't parse multipart automatically here; the client encodes a field 'order' as JSON
      const form = await req.formData()
      const orderRaw = form.get('order')
      try {
        body = typeof orderRaw === 'string' ? JSON.parse(orderRaw) : JSON.parse(String(orderRaw))
      } catch (e) {
        body = {}
      }
      // also allow explicit 'sellers' form field
      const sellersField = form.get('sellers')
      if (sellersField) {
        try {
          body.sellers = typeof sellersField === 'string' ? JSON.parse(sellersField) : JSON.parse(String(sellersField))
        } catch (e) {
          // ignore parse error
        }
      }
    } else {
      body = await req.json()
    }

    const { name, address, phone, items = [], payment, delivery, amounts, sellers } = body || {}
    if (!name || !address || !phone || !Array.isArray(items)) {
      return NextResponse.json({ message: 'invalid payload' }, { status: 400 })
    }
    // normalize items: allow incoming items that may include extra fields (productId, seller)
    const normalizedItems = items.map((it: any) => ({
      name: it.name,
      price: Number(it.price) || 0,
      image: it.image || it.images?.[0] || '',
      qty: Number(it.qty || it.quantity || 1) || 1,
      productId: it._id || it.productId || undefined,
      seller: it.seller || undefined,
    }))

    // Build order payload to save. Persist sellers map when provided.
    const toSave: any = { name, address, phone, items: normalizedItems, payment, delivery, amounts }
    if (sellers && typeof sellers === 'object' && Object.keys(sellers).length) {
      toSave.sellers = sellers
    }

    // Optional: log incoming order payload in development for debugging
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.debug('[api/orders] incoming order payload preview:', { name, address, phone, items: normalizedItems.slice(0,5), sellers: sellers ? Object.keys(sellers) : undefined })
      } catch (e) { /* ignore */ }
    }

    const doc = await Order.create(toSave)
    return NextResponse.json(doc, { status: 201 })
  } catch (e) {
    return NextResponse.json({ message: 'POST error' }, { status: 500 })
  }
}

// PATCH /api/orders  { id, status? , shippingNumber? }
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase()
    const { id, status, shippingNumber } = await req.json()

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: 'invalid id' }, { status: 400 })
    }

    const update: any = { updatedAt: new Date() }
    if (typeof status === 'string') update.status = status
    if (typeof shippingNumber === 'string') update.shippingNumber = shippingNumber

    if (!('status' in update) && !('shippingNumber' in update)) {
      return NextResponse.json({ message: 'nothing to update' }, { status: 400 })
    }

    const doc = await Order.findByIdAndUpdate(id, { $set: update }, { new: true })
    if (!doc) return NextResponse.json({ message: 'Order not found' }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ message: 'PATCH error' }, { status: 500 })
  }
}

// DELETE /api/orders?id=...
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase()
    const id = req.nextUrl.searchParams.get('id')
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: 'invalid id' }, { status: 400 })
    }
    const res = await Order.deleteOne({ _id: id })
    if (res.deletedCount === 0) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ message: 'DELETE error' }, { status: 500 })
  }
}
