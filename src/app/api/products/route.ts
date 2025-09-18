import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Simple placeholder to fix the immediate MongoDB import error
// Full implementation should be done later
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        options: {
          include: {
            values: true
          }
        },
        seller: true
      }
    })
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ message: 'ดึงสินค้าไม่สำเร็จ' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    console.log('[products.POST] body:', JSON.stringify(body))
  const { name, price, category, description, images, options } = body as any
    if (!name || price == null) {
      return NextResponse.json({ message: 'Missing required fields: name and price' }, { status: 400 })
    }

    // create product with basic fields; options/images saved as JSON
    // build nested options create structure for Prisma
    const optionsData = Array.isArray(options) ? options.map((opt: any) => ({
      name: String(opt.name || '').slice(0, 100),
      values: { create: Array.isArray(opt.values) ? opt.values.map((v: any) => ({
        value: String(v.value || '').slice(0, 100),
        price: Number(v.price) || 0,
        priceType: v.priceType === 'replace' ? 'replace' : 'add'
      })) : [] }
    })) : undefined

    const created = await prisma.product.create({
      data: {
        name: String(name).slice(0, 255),
        price: Number(price) || 0,
        category: category ? String(category).slice(0, 100) : null,
        description: description ? String(description) : null,
        images: images && Array.isArray(images) ? images : undefined,
        image: images && Array.isArray(images) && images.length > 0 ? images[0] : undefined,
        options: optionsData ? { create: optionsData } : undefined
      },
      include: { options: { include: { values: true } } }
    })
    console.log('[products.POST] created:', JSON.stringify(created))
    return NextResponse.json(created)
  } catch (error) {
    console.error('create product error', error)
    return NextResponse.json({ message: 'สร้างสินค้าล้มเหลว' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    // Accept query param id
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id || !/^[0-9]+$/.test(String(id))) {
      return NextResponse.json({ message: 'id ไม่ถูกต้อง' }, { status: 400 })
    }

    const numericId = Number(id)
    await prisma.product.delete({ where: { id: numericId } })
    return NextResponse.json({ message: 'ลบสินค้าเรียบร้อย' })
  } catch (error) {
    console.error('products.DELETE error:', error)
    return NextResponse.json({ message: 'ลบสินค้าไม่สำเร็จ', error: (error as any)?.message }, { status: 500 })
  }
}