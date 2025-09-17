import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

// GET /api/orders[?id=...]
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    const seller = req.nextUrl.searchParams.get('seller')
    const customerEmail = req.nextUrl.searchParams.get('customerEmail')
    const customerName = req.nextUrl.searchParams.get('customerName')

    if (id) {
      const numericId = parseInt(id)
      if (isNaN(numericId)) {
        return NextResponse.json({ message: 'invalid id' }, { status: 400 })
      }
      
      const order = await prisma.order.findUnique({
        where: { id: numericId },
        include: {
          messages: true
        }
      })
      
      if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 })
      // normalize to include _id string for frontend and flatten customerInfo
      const customerInfo = order.customerInfo as any || {}
      const shippingNumber = (order.shippingInfo as any)?.trackingNumber || (order as any).shippingNumber || ''
      const resp = { 
        ...order, 
        _id: String(order.id),
        name: customerInfo.name || '',
        phone: customerInfo.phone || '', 
        email: customerInfo.email || '',
        address: customerInfo.address || '',
        shippingNumber,
        shippingInfo: order.shippingInfo || null
      }
      return NextResponse.json(resp, { headers: { 'Cache-Control': 'no-store' } })
    }

  // Build where clause for filtering
  const whereClause: any = {}
    
    if (seller) {
      // Filter orders that contain items from this seller
      whereClause.items = {
        path: '$[*].seller',
        equals: seller
      }
    }

    if (customerEmail) {
      whereClause.customerInfo = {
        path: '$.email',
        equals: customerEmail
      }
    }

    if (customerName) {
      whereClause.customerInfo = {
        path: '$.name',
        string_contains: customerName
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        messages: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const transformed = (orders || []).map(o => {
      const customerInfo = o.customerInfo as any || {}
      const shippingNumber = (o.shippingInfo as any)?.trackingNumber || (o as any).shippingNumber || ''
      return {
        ...o, 
        _id: String(o.id),
        name: customerInfo.name || '',
        phone: customerInfo.phone || '', 
        email: customerInfo.email || '',
        address: customerInfo.address || '',
        shippingNumber,
        shippingInfo: o.shippingInfo || null
      }
    })
    return NextResponse.json(transformed, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('GET /api/orders error', err)
    return NextResponse.json({ message: 'internal error' }, { status: 500 })
  }
}

// POST /api/orders
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let data: any = {}

    if (contentType.includes('multipart/form-data')) {
      // parse FormData: client sends a field 'order' containing JSON and optional 'slip' file
      const form = await req.formData()
      const orderRaw = form.get('order')
      try {
        data = typeof orderRaw === 'string' ? JSON.parse(orderRaw) : JSON.parse(String(orderRaw))
      } catch {
        data = {}
      }

      const sellersField = form.get('sellers')
      if (sellersField) {
        try {
          data.sellers = typeof sellersField === 'string' ? JSON.parse(sellersField) : JSON.parse(String(sellersField))
        } catch {
          /* ignore parse error */
        }
      }

      const slip = form.get('slip') as any
      if (slip && slip.size) {
        try {
          const arr = await slip.arrayBuffer()
          const buf = Buffer.from(arr)
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
          await fs.mkdir(uploadsDir, { recursive: true })
          const safeName = (slip.name || 'slip').replace(/[^a-zA-Z0-9._-]/g, '_')
          const filename = `${Date.now()}-${safeName}`
          const filePath = path.join(uploadsDir, filename)
          await fs.writeFile(filePath, buf)
          const slipUrl = `/uploads/${filename}`
          data.shippingInfo = data.shippingInfo || {}
          data.shippingInfo.slip = { filename, url: slipUrl, size: slip.size }
        } catch (err) {
          console.error('Failed to save slip file', err)
        }
      }
    } else {
      data = await req.json()
    }

    // Normalize incoming payload to ensure customerInfo exists and is complete
    let { customerInfo, totalAmount } = data || {}
    const { shippingInfo, items } = data || {}

    // Some clients send top-level fields (name, phone, address, email) instead of or in addition to customerInfo
    // Ensure customerInfo has all required fields, falling back to top-level fields
    const name = customerInfo?.name || data?.name || data?.customerName || data?.customer?.name
    const phone = customerInfo?.phone || data?.phone || data?.tel || data?.customer?.phone
    const address = customerInfo?.address || data?.address || data?.addr || data?.customer?.address
    const email = customerInfo?.email || data?.email || data?.userEmail || data?.customer?.email

    // Always construct a complete customerInfo object
    customerInfo = { 
      name: name || '', 
      phone: phone || '', 
      address: address || '', 
      email: email || '' 
    }    // If amounts.total present, use it as totalAmount
    if ((!totalAmount || Number.isNaN(Number(totalAmount))) && data?.amounts?.total) {
      const t = data.amounts.total
      totalAmount = typeof t === 'string' ? parseFloat(t) : Number(t)
    }

    if (!customerInfo || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Generate order number
    const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        totalAmount: parseFloat(totalAmount) || 0,
        status: 'pending',
        customerInfo,
        shippingInfo: shippingInfo || null,
        items
      }
    })

    // return created order id as _id for frontend
    return NextResponse.json({ 
      message: 'Order created successfully', 
      orderId: order.id,
      orderNumber: order.orderNumber,
      _id: String(order.id) 
    })
  } catch (err) {
    console.error('POST /api/orders error', err)
    return NextResponse.json({ message: 'Failed to create order', error: String(err) }, { status: 500 })
  }
}

// PUT /api/orders - update order status
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, trackingNumber, shippingNumber } = body

    if (!id || (!status && !trackingNumber && !shippingNumber)) {
      return NextResponse.json({ message: 'Missing id or update data' }, { status: 400 })
    }

    const numericId = parseInt(id)
    if (isNaN(numericId)) {
      return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
    }

    const updateData: any = {}
    
    if (status) {
      updateData.status = status
    }
    
    if (trackingNumber || shippingNumber) {
      updateData.shippingInfo = {
        trackingNumber: trackingNumber || shippingNumber
      }
    }

    const order = await prisma.order.update({
      where: { id: numericId },
      data: updateData
    })

    return NextResponse.json({ message: 'Order updated successfully', order })
  } catch (err) {
    console.error('PUT /api/orders error', err)
    return NextResponse.json({ message: 'Failed to update order' }, { status: 500 })
  }
}

// PATCH /api/orders - same as PUT for order status updates
export async function PATCH(req: NextRequest) {
  return PUT(req)
}

// DELETE /api/orders
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ message: 'Missing id' }, { status: 400 })
    }

    const numericId = parseInt(id)
    if (isNaN(numericId)) {
      return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
    }

    await prisma.order.delete({
      where: { id: numericId }
    })

    return NextResponse.json({ message: 'Order deleted successfully' })
  } catch (err) {
    console.error('DELETE /api/orders error', err)
    return NextResponse.json({ message: 'Failed to delete order' }, { status: 500 })
  }
}