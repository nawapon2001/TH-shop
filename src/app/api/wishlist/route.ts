import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const user = url.searchParams.get('user')
    
    if (!user) {
      return NextResponse.json({ wishlist: [] })
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { user }
    })

    const items = wishlist?.items || []
    
    return NextResponse.json({ 
      wishlist: Array.isArray(items) ? items : [] 
    })
  } catch (error) {
    console.error('GET /api/wishlist error', error)
    return NextResponse.json({ 
      wishlist: [],
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user, item } = body || {}
    
    if (!user || !item) {
      return NextResponse.json({ ok: false, message: 'Missing user or item' }, { status: 400 })
    }

    // Normalize item to include an id for reliable deletion later
    const normalized = { 
      ...item, 
      id: item.id || item._id || String(Date.now() + Math.random()) 
    }

    // Try to find existing wishlist
    const existingWishlist = await prisma.wishlist.findUnique({
      where: { user }
    })

    if (existingWishlist) {
      const currentItems = Array.isArray(existingWishlist.items) ? existingWishlist.items as any[] : []
      
      // Check if item already exists (avoid duplicates)
      const itemExists = currentItems.some((existing: any) => 
        existing.id === normalized.id || 
        (existing._id && existing._id === normalized._id)
      )

      if (!itemExists) {
        const updatedItems = [...currentItems, normalized]
        
        await prisma.wishlist.update({
          where: { user },
          data: { items: updatedItems }
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
  } catch (error) {
    console.error('POST /api/wishlist error', error)
    return NextResponse.json({ 
      ok: false,
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const user = url.searchParams.get('user')
    const id = url.searchParams.get('id')
    
    if (!user || !id) {
      return NextResponse.json({ ok: false, message: 'Missing user or id' }, { status: 400 })
    }

    const existingWishlist = await prisma.wishlist.findUnique({
      where: { user }
    })

    if (!existingWishlist) {
      return NextResponse.json({ ok: false, message: 'Wishlist not found' }, { status: 404 })
    }

    const currentItems = Array.isArray(existingWishlist.items) ? existingWishlist.items as any[] : []
    
    // Filter out the item to be deleted
    const updatedItems = currentItems.filter((item: any) => 
      item.id !== id && item._id !== id
    )

    await prisma.wishlist.update({
      where: { user },
      data: { items: updatedItems }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/wishlist error', error)
    return NextResponse.json({ 
      ok: false,
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
