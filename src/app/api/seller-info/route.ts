import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const username = url.searchParams.get('username')
    
    if (!username) {
      return NextResponse.json({ message: 'username required' }, { status: 400 })
    }

    const seller = await prisma.seller.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        shopName: true,
        description: true,
        birthDate: true,
        province: true,
        address: true,
        image: true,
        shopImage: true,
        bankAccount: true,
        bankName: true,
        accountHolderName: true
      }
    })

    if (!seller) {
      return NextResponse.json({ message: 'Seller not found' }, { status: 404 })
    }

    return NextResponse.json(seller)
  } catch (err) {
    console.error('GET /api/seller-info error', err)
    return NextResponse.json({ message: 'Internal error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url)
    const username = url.searchParams.get('username')
    const body = await req.json()
    
    if (!username) {
      return NextResponse.json({ message: 'username required' }, { status: 400 })
    }

    const seller = await prisma.seller.update({
      where: { username },
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        shopName: body.shopName,
        description: body.description,
        birthDate: body.birthDate,
        province: body.province,
        address: body.address,
        image: body.image,
        shopImage: body.shopImage,
        bankAccount: body.bankAccount,
        bankName: body.bankName,
        accountHolderName: body.accountHolderName
      }
    })

    return NextResponse.json({ message: 'Updated successfully', seller })
  } catch (err) {
    console.error('PUT /api/seller-info error', err)
    return NextResponse.json({ message: 'Internal error' }, { status: 500 })
  }
}
