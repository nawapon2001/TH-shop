import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const sellers = await prisma.seller.findMany()
    // remove sensitive fields and normalize id
    const out = sellers.map(s => {
      const item: any = { ...s }
      delete item.password
      delete item.createdAt
      delete item.updatedAt
      item._id = String(s.id)
      delete item.id
      return item
    })
    return NextResponse.json(out)
  } catch (err) {
    console.error('GET /api/sellers error', err)
    return NextResponse.json([], { status: 200 })
  }
}
