import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

function normalizeOptions(options: any): any[] {
  if (!options || !Array.isArray(options)) return []
  
  return options.map((option: any) => ({
    name: option.name || '',
    values: (option.values || []).map((value: any) => ({
      value: value.value || '',
      price: value.price || 0,
      priceType: value.priceType || 'add'
    }))
  })).filter(o => o.name && o.values.length > 0)
}

export async function DELETE(_req: Request, { params }: any) {
  try {
    const { id } = await params
    
    // only accept numeric ids (Prisma Product.id is an Int)
    const numericId = Number(id)
    if (!id || !/^[0-9]+$/.test(String(id)) || Number.isNaN(numericId)) {
      return NextResponse.json({ message: 'id ไม่ถูกต้อง' }, { status: 400 })
    }

    const deleted = await prisma.product.delete({ where: { id: Number(id) } })

    if (!deleted) return NextResponse.json({ message: 'ไม่พบสินค้า' }, { status: 404 })
    return NextResponse.json({ message: 'ลบสินค้าสำเร็จ' })
  } catch (error) {
    console.error('DELETE product error:', error)
    return NextResponse.json({ message: 'ลบสินค้าไม่สำเร็จ' }, { status: 500 })
  }
}

export async function GET(_req: Request, { params }: any) {
  try {
    const { id } = await params
    // Product model uses numeric id. Validate that the incoming param is digits-only.
    if (!id || !/^[0-9]+$/.test(String(id))) {
      return NextResponse.json({ message: 'id ไม่ถูกต้อง' }, { status: 400 })
    }

    const numericId = Number(id)

    const product = await prisma.product.findUnique({
      where: { id: numericId },
      include: {
        seller: true,
        options: {
          include: {
            values: true
          }
        }
      }
    })

    if (!product) return NextResponse.json({ message: 'ไม่พบสินค้า' }, { status: 404 })

    // normalize options and expose a string _id so frontend code can use either _id or id
    return NextResponse.json({
      ...product,
      _id: String(product.id),
      options: normalizeOptions(product.options)
    })
  } catch (error) {
    console.error('GET product error:', error)
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
