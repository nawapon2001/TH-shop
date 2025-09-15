import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/profile?email=...
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase()
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('GET /api/profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/profile - Update user profile
export async function PUT(req: Request) {
  try {
    const { email, name, phone, address } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Validate input
    if (name && name.length > 100) {
      return NextResponse.json({ error: 'Name too long' }, { status: 400 })
    }

    if (phone && !/^0\d{9}$/.test(phone.trim())) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { 
        email: email.toLowerCase()
      },
      data: {
        name: name?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('PUT /api/profile error:', error)
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
