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

    if (id) {
      if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ message: 'invalid id' }, { status: 400 })
      }
      const doc = await Order.findById(id).lean()
      if (!doc) return NextResponse.json({ message: 'Order not found' }, { status: 404 })
      return NextResponse.json(doc, { headers: { 'Cache-Control': 'no-store' } })
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
    const body = await req.json()

    const { name, address, phone, items = [], payment, delivery, amounts } = body || {}
    if (!name || !address || !phone || !Array.isArray(items)) {
      return NextResponse.json({ message: 'invalid payload' }, { status: 400 })
    }

    const doc = await Order.create({
      name, address, phone, items, payment, delivery, amounts
    })
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
