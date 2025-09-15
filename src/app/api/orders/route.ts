import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/orders[?id=...]
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    const seller = req.nextUrl.searchParams.get('seller')

    if (id) {
      const orderId = parseInt(id)
      if (isNaN(orderId)) {
        return NextResponse.json({ message: 'ID ไม่ถูกต้อง' }, { status: 400 })
      }
      
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      })
      
      if (!order) {
        return NextResponse.json({ message: 'ไม่พบคำสั่งซื้อ' }, { status: 404 })
      }
      
      return NextResponse.json({
        _id: order.id.toString(),
        ...order
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    // ถ้าระบุ seller ให้กรองตาม seller
    let whereClause: any = {}
    if (seller) {
      // Filter orders by seller in items (JSON field search)
      whereClause = {
        OR: [
          // Search in items JSON for seller field
          {
            items: {
              path: '$[*].seller',
              equals: seller
            }
          }
        ]
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

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
  }
}

// POST /api/orders
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    
    // Debug logging
    console.log('🛒 Orders API - Received data:', {
      totalAmount: data.totalAmount,
      totalAmountType: typeof data.totalAmount,
      customerInfo: data.customerInfo,
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
        }
      }, { status: 400 })
    }

    // Handle customer info - support both embedded and separate fields
    let customerInfo = data.customerInfo
    if (!customerInfo && (data.name || data.phone || data.address)) {
      customerInfo = {
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        address: data.address || ''
      }
    }

    if (!customerInfo || !customerInfo.name || !customerInfo.phone) {
      return NextResponse.json({ message: 'กรุณาระบุข้อมูลลูกค้า (ชื่อ และ เบอร์โทร)' }, { status: 400 })
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ message: 'กรุณาระบุรายการสินค้า' }, { status: 400 })
    }

    // Check if order number already exists (in case of provided orderNumber)
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber }
    })

    if (existingOrder) {
      // If auto-generated number conflicts, try again with timestamp
      if (!data.orderNumber) {
        const timestamp = Date.now()
        orderNumber = `ORD-${timestamp}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
      } else {
        return NextResponse.json({ message: 'หมายเลขคำสั่งซื้อนี้ถูกใช้แล้ว' }, { status: 400 })
      }
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        totalAmount: totalAmount, // Use parsed totalAmount
        status: data.status || 'pending',
        customerInfo: customerInfo, // Use processed customerInfo
        shippingInfo: {
          method: data.delivery || null,
          payment: data.payment || null,
          note: data.note || null,
          ...data.shippingInfo
        },
        items: data.items
      }
    })

    return NextResponse.json({ 
      message: 'สร้างคำสั่งซื้อเรียบร้อยแล้ว', 
      id: order.id.toString(),
      orderNumber: order.orderNumber,
      order: {
        _id: order.id.toString(),
        ...order
      }
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

// PUT /api/orders (update order status)
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, status, ...updateData } = data

    if (!id) {
      return NextResponse.json({ message: 'กรุณาระบุ ID คำสั่งซื้อ' }, { status: 400 })
    }

    const orderId = parseInt(id)
    if (isNaN(orderId)) {
      return NextResponse.json({ message: 'ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ message: 'สถานะไม่ถูกต้อง' }, { status: 400 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(status && { status }),
        ...updateData
      }
    })

    return NextResponse.json({
      message: 'อัปเดตคำสั่งซื้อเรียบร้อยแล้ว',
      order: {
        _id: updatedOrder.id.toString(),
        ...updatedOrder
      }
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการอัปเดตคำสั่งซื้อ',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

// DELETE /api/orders?id=...
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ message: 'กรุณาระบุ ID คำสั่งซื้อ' }, { status: 400 })
    }

    const orderId = parseInt(id)
    if (isNaN(orderId)) {
      return NextResponse.json({ message: 'ID ไม่ถูกต้อง' }, { status: 400 })
    }

    // ตรวจสอบว่ามีคำสั่งซื้อนี้อยู่หรือไม่
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!existingOrder) {
      return NextResponse.json({ message: 'ไม่พบคำสั่งซื้อ' }, { status: 404 })
    }

    // ลบคำสั่งซื้อ
    await prisma.order.delete({
      where: { id: orderId }
    })

    return NextResponse.json({
      message: 'ลบคำสั่งซื้อเรียบร้อยแล้ว',
      deletedOrderId: orderId
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการลบคำสั่งซื้อ',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
