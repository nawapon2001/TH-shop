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
<<<<<<< Updated upstream
  const seller = req.nextUrl.searchParams.get('seller')
=======
    const seller = req.nextUrl.searchParams.get('seller')
    const customerEmail = req.nextUrl.searchParams.get('customerEmail')
    const customerName = req.nextUrl.searchParams.get('customerName')
>>>>>>> Stashed changes

    if (id) {
      if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ message: 'invalid id' }, { status: 400 })
      }
      const doc = await Order.findById(id).lean()
      if (!doc) return NextResponse.json({ message: 'Order not found' }, { status: 404 })
      return NextResponse.json(doc, { headers: { 'Cache-Control': 'no-store' } })
    }

<<<<<<< Updated upstream
    // ถ้าระบุ seller ให้คืนเฉพาะคำสั่งซื้อที่มี item.seller เท่ากับค่านั้น
=======
    // สร้าง where clause สำหรับการกรองข้อมูล
    let whereClause: any = {}
    
>>>>>>> Stashed changes
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
    } else if (customerEmail || customerName) {
      // กรองตาม customer email หรือ name ใน customerInfo
      const customerFilters = []
      
      if (customerEmail) {
        customerFilters.push({
          customerInfo: {
            path: '$.email',
            string_contains: customerEmail
          }
        })
        // เพิ่มการค้นหาแบบ exact match ด้วย
        customerFilters.push({
          customerInfo: {
            path: '$.email',
            equals: customerEmail
          }
        })
      }
      
      if (customerName) {
        customerFilters.push({
          customerInfo: {
            path: '$.name',
            string_contains: customerName
          }
        })
        // เพิ่มการค้นหาแบบ exact match ด้วย
        customerFilters.push({
          customerInfo: {
            path: '$.name',
            equals: customerName
          }
        })
      }
      
      whereClause = {
        OR: customerFilters
      }
    }

<<<<<<< Updated upstream
    // ทั้งหมด (ใหม่ -> เก่า)
    const docs = await Order.find().sort({ createdAt: -1 }).lean()
    return NextResponse.json(docs, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ message: 'GET error' }, { status: 500 })
=======
    console.log('🔍 Orders API - Filter params:', {
      seller,
      customerEmail,
      customerName,
      whereClause
    })

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📦 Orders API - Found ${orders.length} orders`)

    // Transform to match frontend expectations
    const transformedOrders = orders.map(order => ({
      _id: order.id.toString(),
      ...order
    }))

    return NextResponse.json(transformedOrders, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
>>>>>>> Stashed changes
  }
}

// POST /api/orders  (ถ้าคุณต้องการ endpoint สร้างออเดอร์)
export async function POST(req: NextRequest) {
  try {
<<<<<<< Updated upstream
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
=======
    const data = await req.json()
    
    // Debug logging
    console.log('🛒 Orders API - Received data:', {
      totalAmount: data.totalAmount,
      totalAmountType: typeof data.totalAmount,
      customerInfo: data.customerInfo,
      name: data.name,
      phone: data.phone,
      items: data.items
    })

    // Auto-generate orderNumber if not provided
    let orderNumber = data.orderNumber?.trim()
    if (!orderNumber) {
      // Generate unique order number: ORD-YYYYMMDD-HHMMSS-RAND
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
      const randStr = Math.random().toString(36).substr(2, 4).toUpperCase()
      orderNumber = `ORD-${dateStr}-${timeStr}-${randStr}`
    }

    // Validate and convert totalAmount - support both old and new format
    let totalAmount = data.totalAmount
    
    // If totalAmount not provided but amounts.total exists (new format)
    if (!totalAmount && data.amounts?.total) {
      totalAmount = data.amounts.total
    }
    
    // Convert to number if string
    if (typeof totalAmount === 'string') {
      totalAmount = parseFloat(totalAmount)
    }

    if (!totalAmount || totalAmount <= 0 || isNaN(totalAmount)) {
      return NextResponse.json({ 
        message: 'กรุณาระบุยอดรวมที่ถูกต้อง',
        debug: {
          receivedTotalAmount: data.totalAmount,
          receivedAmounts: data.amounts,
          finalTotalAmount: totalAmount,
          type: typeof totalAmount
>>>>>>> Stashed changes
        }
      }
    } else {
      body = await req.json()
    }

<<<<<<< Updated upstream
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
=======
    // If customerInfo exists but missing name/phone, try to get from top-level fields
    if (customerInfo) {
      if (!customerInfo.name && data.name) {
        customerInfo.name = data.name
      }
      if (!customerInfo.phone && data.phone) {
        customerInfo.phone = data.phone
      }
    }

    if (!customerInfo || !customerInfo.name || !customerInfo.phone) {
      return NextResponse.json({ message: 'กรุณาระบุข้อมูลลูกค้า (ชื่อ และ เบอร์โทร)' }, { status: 400 })
>>>>>>> Stashed changes
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
