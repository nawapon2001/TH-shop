import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type SellerInfo = {
  username: string
  fullName?: string
  email?: string
  phone?: string
  shopName?: string
  description?: string
  birthDate?: string
  province?: string
  address?: string
  image?: string
  shopImage?: string
  bankAccount?: string
  bankName?: string
  accountHolderName?: string
}

// GET /api/seller-info?username=...
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const username = url.searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 })
    }

    const seller = await prisma.seller.findUnique({
      where: { username }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Remove sensitive information
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sellerInfo } = seller

    // Transform to match frontend expectations
    const response = {
      _id: seller.id.toString(),
      ...sellerInfo
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('GET /api/seller-info error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

// PUT /api/seller-info
export async function PUT(req: Request) {
  try {
    const body: SellerInfo = await req.json()
    const { username, ...updateData } = body

    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 })
    }

    // Check if seller exists
    const existingSeller = await prisma.seller.findUnique({
      where: { username }
    })

    if (!existingSeller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Update seller information
    const updatedSeller = await prisma.seller.update({
      where: { username },
      data: {
        fullName: updateData.fullName || null,
        email: updateData.email || null,
        phone: updateData.phone || null,
        shopName: updateData.shopName || null,
        description: updateData.description || null,
        birthDate: updateData.birthDate || null,
        province: updateData.province || null,
        address: updateData.address || null,
        image: updateData.image || null,
        shopImage: updateData.shopImage || null,
        bankAccount: updateData.bankAccount || null,
        bankName: updateData.bankName || null,
        accountHolderName: updateData.accountHolderName || null
      }
    })

    // Remove sensitive information
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sellerInfo } = updatedSeller

    // Transform to match frontend expectations
    const response = {
      _id: updatedSeller.id.toString(),
      ...sellerInfo
    }

    return NextResponse.json({ ok: true, seller: response })
  } catch (error) {
    console.error('PUT /api/seller-info error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

// POST /api/seller-info (for creating/updating seller info)
export async function POST(req: Request) {
  try {
    const body: SellerInfo = await req.json()
    const { username, ...sellerData } = body

    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 })
    }

    // Try to update existing seller or create new one
    const seller = await prisma.seller.upsert({
      where: { username },
      update: {
        fullName: sellerData.fullName || null,
        email: sellerData.email || null,
        phone: sellerData.phone || null,
        shopName: sellerData.shopName || null,
        description: sellerData.description || null,
        birthDate: sellerData.birthDate || null,
        province: sellerData.province || null,
        address: sellerData.address || null,
        image: sellerData.image || null,
        shopImage: sellerData.shopImage || null,
        bankAccount: sellerData.bankAccount || null,
        bankName: sellerData.bankName || null,
        accountHolderName: sellerData.accountHolderName || null
      },
      create: {
        username,
        fullName: sellerData.fullName || null,
        email: sellerData.email || null,
        phone: sellerData.phone || null,
        shopName: sellerData.shopName || null,
        description: sellerData.description || null,
        birthDate: sellerData.birthDate || null,
        province: sellerData.province || null,
        address: sellerData.address || null,
        image: sellerData.image || null,
        shopImage: sellerData.shopImage || null,
        bankAccount: sellerData.bankAccount || null,
        bankName: sellerData.bankName || null,
        accountHolderName: sellerData.accountHolderName || null
      }
    })

    // Remove sensitive information
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sellerInfo } = seller

    // Transform to match frontend expectations
    const response = {
      _id: seller.id.toString(),
      ...sellerInfo
    }

    return NextResponse.json({ ok: true, seller: response })
  } catch (error) {
    console.error('POST /api/seller-info error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
