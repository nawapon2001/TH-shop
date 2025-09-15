import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            values: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ message: 'ไม่พบสินค้า' }, { status: 404 })
    }

    // Transform data to match frontend expectations
    const transformedProduct = {
      _id: product.id.toString(),
      ...product,
      options: product.options.map((option: any) => ({
        name: option.name,
        values: option.values.map((value: any) => ({
          value: value.value,
          price: value.price,
          priceType: value.priceType,
          stock: value.stock,
          sku: value.sku
        }))
      }))
    }

    return NextResponse.json(transformedProduct)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const data = await request.json()

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        price: data.price,
        category: data.category,
        description: data.description,
        image: data.image,
        images: data.images,
        stock: data.stock,
        // อัปเดต options ถ้ามี
        ...(data.options && {
          options: {
            deleteMany: {}, // ลบ options เก่าทั้งหมด
            create: data.options.map((option: any) => ({
              name: option.name,
              values: {
                create: option.values.map((value: any) => ({
                  value: value.value,
                  price: value.price || 0,
                  priceType: value.priceType || 'add',
                  stock: value.stock || 0,
                  sku: value.sku || null
                }))
              }
            }))
          }
        })
      },
      include: {
        options: {
          include: {
            values: true
          }
        }
      }
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการอัปเดต',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID ไม่ถูกต้อง' }, { status: 400 })
    }

    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'ลบสินค้าเรียบร้อยแล้ว' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการลบ',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
