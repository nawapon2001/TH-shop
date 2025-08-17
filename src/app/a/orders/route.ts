import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Order from '@/models/Order'
import { ObjectId } from 'mongodb'

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    const body = await req.json()
    // Add status field and shippingNumber field on creation
    const order = await Order.create({
      name: body.name,
      address: body.address,
      phone: body.phone,
      items: body.items,
      createdAt: new Date(),
      status: body.status || 'pending',
      shippingNumber: body.shippingNumber || '',
    })
    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()
    const orders = await Order.find().sort({ createdAt: -1 })
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase()
    const body = await req.json()
    const { id, status, shippingNumber } = body

    if (!id) {
      return NextResponse.json({ message: 'Missing order id' }, { status: 400 })
    }

    const update: any = {}
    if (typeof status === 'string') update.status = status
    if (typeof shippingNumber === 'string') update.shippingNumber = shippingNumber

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ message: 'No update fields' }, { status: 400 })
    }

    const result = await Order.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
