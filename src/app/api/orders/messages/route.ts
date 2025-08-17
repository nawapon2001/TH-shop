import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Order from '@/models/Order'
import { connectToDatabase } from '@/lib/mongodb'

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
    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required' }, { status: 400, headers: corsHeaders })
    }
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json({ success: false, message: 'invalid orderId' }, { status: 400, headers: corsHeaders })
    }

    const doc = await Order.findById(orderId, { messages: 1 }).lean()
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404, headers: corsHeaders })
    }

    // เรียงแชทจากเก่า -> ใหม่
    const messages = (doc.messages || []).sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    return NextResponse.json({ success: true, messages }, { headers: corsHeaders })
  } catch (error) {
    console.error('GET messages error:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch messages' }, { status: 500, headers: corsHeaders })
  }
}

// POST { orderId, message, role: 'shop' | 'customer' }
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    const body = await req.json().catch(() => ({}))
    const orderId = body?.orderId as string
    const message = (body?.message as string)?.trim()
    const role = body?.role === 'shop' ? 'shop' : 'customer'

    if (!orderId || !message) {
      return NextResponse.json({ success: false, message: 'orderId and message are required' }, { status: 400, headers: corsHeaders })
    }
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json({ success: false, message: 'invalid orderId' }, { status: 400, headers: corsHeaders })
    }

    const updated = await Order.findByIdAndUpdate(
      orderId,
      { $push: { messages: { role, text: message, createdAt: new Date() } } },
      { new: true, runValidators: true }
    )

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404, headers: corsHeaders })
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('POST messages error:', error)
    return NextResponse.json({ success: false, message: 'Failed to send message' }, { status: 500, headers: corsHeaders })
  }
}
