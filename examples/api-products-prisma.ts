// ตัวอย่าง API route ใหม่ที่ใช้ Prisma แทน MongoDB
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/products - ดึงข้อมูลสินค้าทั้งหมด
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}
    
    if (category) {
      where.category = category
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        options: {
          include: {
            values: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const total = await prisma.product.count({ where })

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products - สร้างสินค้าใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, price, category, description, image, images, options = [] } = body

    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        category,
        description,
        image,
        images: images || null,
        options: {
          create: options.map((option: any) => ({
            name: option.name,
            values: {
              create: option.values.map((value: any) => ({
                value: value.value,
                price: parseFloat(value.price || 0),
                priceType: value.priceType || 'add',
                stock: parseInt(value.stock || 0)
              }))
            }
          }))
        }
      },
      include: {
        options: {
          include: {
            values: true
          }
        }
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - อัพเดตสินค้า
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    const body = await request.json()
    
    const { name, price, category, description, image, images, options = [] } = body

    // ลบ options เก่าก่อน (cascade delete จะลบ values ด้วย)
    await prisma.productOption.deleteMany({
      where: { productId: id }
    })

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        price: parseFloat(price),
        category,
        description,
        image,
        images: images || null,
        options: {
          create: options.map((option: any) => ({
            name: option.name,
            values: {
              create: option.values.map((value: any) => ({
                value: value.value,
                price: parseFloat(value.price || 0),
                priceType: value.priceType || 'add',
                stock: parseInt(value.stock || 0)
              }))
            }
          }))
        }
      },
      include: {
        options: {
          include: {
            values: true
          }
        }
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - ลบสินค้า
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')

    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
