import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const sellers = await prisma.seller.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform to match frontend expectations
    const transformedSellers = sellers.map(seller => ({
      _id: seller.id.toString(),
      ...seller
    }))

    return NextResponse.json(transformedSellers)
  } catch (error) {
    console.error('Error fetching sellers:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ขาย',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // Validate required fields
    if (!data.username || !data.username.trim()) {
      return NextResponse.json({ message: 'กรุณาระบุชื่อผู้ใช้' }, { status: 400 })
    }

    // Check if username already exists
    const existingSeller = await prisma.seller.findUnique({
      where: { username: data.username.trim() }
    })

    if (existingSeller) {
      return NextResponse.json({ message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' }, { status: 400 })
    }

    // Check if email already exists (if provided)
    if (data.email && data.email.trim()) {
      const existingEmailSeller = await prisma.seller.findUnique({
        where: { email: data.email.trim() }
      })

      if (existingEmailSeller) {
        return NextResponse.json({ message: 'อีเมลนี้ถูกใช้แล้ว' }, { status: 400 })
      }
    }

    const seller = await prisma.seller.create({
      data: {
        username: data.username.trim(),
        shopName: data.shopName?.trim() || null,
        fullName: data.fullName?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        image: data.image || null,
        address: data.address?.trim() || null
      }
    })

    return NextResponse.json({ 
      message: 'เพิ่มผู้ขายเรียบร้อยแล้ว', 
      id: seller.id.toString(),
      seller: {
        _id: seller.id.toString(),
        ...seller
      }
    })
  } catch (error) {
    console.error('Error creating seller:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการสร้างผู้ขาย',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
