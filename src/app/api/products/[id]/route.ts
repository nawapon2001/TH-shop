import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'

type ProductOption = { name: string; values: string[] }
const ensureString = (v: unknown) => (v == null ? '' : String(v).trim())

function normalizeOptions(raw: any): ProductOption[] {
  if (Array.isArray(raw) && raw.every(o => typeof o === 'object' && Array.isArray(o?.values))) {
    return (raw as any[]).map(o => ({
      name: ensureString(o.name),
      values: (o.values || []).map(ensureString).filter(Boolean)
    })).filter(o => o.name && o.values.length)
  }
  if (Array.isArray(raw) && raw.every(v => typeof v === 'string' || typeof v === 'number')) {
    const values = (raw as Array<string|number>).map(ensureString).filter(Boolean)
    return values.length ? [{ name: 'ตัวเลือก', values }] : []
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return Object.entries(raw).map(([k, vals]) => ({
      name: ensureString(k),
      values: Array.isArray(vals) ? (vals as any[]).map(ensureString).filter(Boolean) : []
    })).filter(o => o.name && o.values.length)
  }
  return []
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    await connectToDatabase()

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'id ไม่ถูกต้อง' }, { status: 400 })
    }

    const deleted = await Product.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ message: 'ไม่พบสินค้า' }, { status: 404 })
    return NextResponse.json({ message: 'ลบสินค้าสำเร็จ' })
  } catch (error) {
    console.error('DELETE product error:', error)
    return NextResponse.json({ message: 'ลบสินค้าไม่สำเร็จ' }, { status: 500 })
  }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const { id } = params

    if (!id) return NextResponse.json({ message: 'กรุณาระบุ id' }, { status: 400 })
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'id ไม่ถูกต้อง' }, { status: 400 })
    }

    const product = await Product.findById(id).lean()
    if (!product) return NextResponse.json({ message: 'ไม่พบสินค้า' }, { status: 404 })

    return NextResponse.json({ ...product, options: normalizeOptions(product.options) })
  } catch (error) {
    console.error('GET product error:', error)
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
