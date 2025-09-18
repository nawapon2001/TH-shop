import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// CORS headers (กัน preflight 405)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// OPTIONS สำหรับ preflight
export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}

// GET /api/orders/messages?orderId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required' }, { status: 400, headers: corsHeaders })
    }

    const orderIdNum = parseInt(orderId)
    if (isNaN(orderIdNum)) {
      return NextResponse.json({ success: false, message: 'invalid orderId' }, { status: 400, headers: corsHeaders })
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderIdNum }
    })

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404, headers: corsHeaders })
    }

    // Get messages for this order, sorted by creation time
    const messages = await prisma.orderMessage.findMany({
      where: { orderId: orderIdNum },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ success: true, messages }, { headers: corsHeaders })
  } catch (error) {
    console.error('GET messages error:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch messages' }, { status: 500, headers: corsHeaders })
  }
}

// POST { orderId, message, role: 'shop' | 'customer' }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const orderId = body?.orderId as string
    const message = (body?.message as string)?.trim()
    const role = body?.role === 'shop' ? 'shop' : 'customer'

    if (!orderId || !message) {
      return NextResponse.json({ success: false, message: 'orderId and message are required' }, { status: 400, headers: corsHeaders })
    }

    const orderIdNum = parseInt(orderId)
    if (isNaN(orderIdNum)) {
      return NextResponse.json({ success: false, message: 'invalid orderId' }, { status: 400, headers: corsHeaders })
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderIdNum }
    })

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404, headers: corsHeaders })
    }

    // Create new message
    await prisma.orderMessage.create({
      data: {
        orderId: orderIdNum,
        sender: role,
        message: message,
      }
    })

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('POST messages error:', error)
    return NextResponse.json({ success: false, message: 'Failed to send message' }, { status: 500, headers: corsHeaders })
  }
}
