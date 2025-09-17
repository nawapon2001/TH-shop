import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const user = url.searchParams.get('user')
    if (!user) return NextResponse.json({ wishlist: [] })

    const wishlist = await prisma.wishlist.findUnique({
      where: { user }
    })
    
    const items = wishlist?.items ? (Array.isArray(wishlist.items) ? wishlist.items : []) : []
    return NextResponse.json({ wishlist: items })
  } catch (err) {
    console.error('GET /api/wishlist error', err)
    return NextResponse.json({ wishlist: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user, item } = body || {}
    if (!user || !item) return NextResponse.json({ ok: false }, { status: 400 })

    // Normalize item to include an `id` string for reliable deletion later
    const normalized = { ...item, id: item.id ?? (item._id ? String(item._id) : undefined) }

    // Find existing wishlist or create new one
    const existingWishlist = await prisma.wishlist.findUnique({
      where: { user }
    })

    if (existingWishlist) {
      // Update existing wishlist by adding item if not already in the list
      const items = Array.isArray(existingWishlist.items) ? existingWishlist.items as any[] : []
      const itemExists = items.some((existingItem: any) => existingItem.id === normalized.id)
      
      if (!itemExists) {
        await prisma.wishlist.update({
          where: { user },
          data: { items: [...items, normalized] }
        })
      }
    } else {
      // Create new wishlist
      await prisma.wishlist.create({
        data: {
          user,
          items: [normalized]
        }
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/wishlist error', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const user = url.searchParams.get('user')
    const id = url.searchParams.get('id')
    if (!user || !id) return NextResponse.json({ ok: false }, { status: 400 })

    const existingWishlist = await prisma.wishlist.findUnique({
      where: { user }
    })

    if (!existingWishlist) {
      return NextResponse.json({ ok: false }, { status: 404 })
    }

    const items = Array.isArray(existingWishlist.items) ? existingWishlist.items as any[] : []
    
    // Try different ways to match the item to remove
    const newItems = items.filter((item: any) => {
      // Try string id match
      if (item.id === id) return false
      // Try numeric id match
      const maybeNum = Number(id)
      if (!Number.isNaN(maybeNum) && item.id === maybeNum) return false
      // Try _id match
      if (item._id === id) return false
      // Keep the item if no match
      return true
    })

    // Update the wishlist with filtered items
    await prisma.wishlist.update({
      where: { user },
      data: { items: newItems }
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/wishlist error', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
