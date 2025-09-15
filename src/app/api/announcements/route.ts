import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/announcements[?id=...]
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    
    if (id) {
      const announcementId = parseInt(id)
      if (isNaN(announcementId)) {
        return NextResponse.json({ message: 'ID ไม่ถูกต้อง' }, { status: 400 })
      }
      
      const announcement = await prisma.announcement.findUnique({
        where: { id: announcementId }
      })
      
      if (!announcement) {
        return NextResponse.json({ message: 'ไม่พบประกาศ' }, { status: 404 })
      }
      
      return NextResponse.json({
        _id: announcement.id.toString(),
        ...announcement
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // Transform for frontend compatibility
    const transformedAnnouncements = announcements.map(announcement => ({
      _id: announcement.id.toString(),
      ...announcement
    }))

    return NextResponse.json(transformedAnnouncements, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประกาศ',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

// POST /api/announcements
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (!data.title?.trim()) {
      return NextResponse.json({ message: 'กรุณาระบุหัวข้อประกาศ' }, { status: 400 })
    }

    if (!data.content?.trim()) {
      return NextResponse.json({ message: 'กรุณาระบุเนื้อหาประกาศ' }, { status: 400 })
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        type: data.type || 'info',
        isActive: data.isActive !== false, // Default to true
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        image: data.image || null
      }
    })

    return NextResponse.json({
      message: 'สร้างประกาศสำเร็จ',
      announcement: {
        _id: announcement.id.toString(),
        ...announcement
      }
    })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการสร้างประกาศ',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

// PUT /api/announcements
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const id = req.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ message: 'กรุณาระบุ ID ประกาศ' }, { status: 400 })
    }

    const announcementId = parseInt(id)
    if (isNaN(announcementId)) {
      return NextResponse.json({ message: 'ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: announcementId }
    })

    if (!existingAnnouncement) {
      return NextResponse.json({ message: 'ไม่พบประกาศ' }, { status: 404 })
    }

    const updateData: any = {}
    
    if (data.title !== undefined) {
      if (!data.title?.trim()) {
        return NextResponse.json({ message: 'กรุณาระบุหัวข้อประกาศ' }, { status: 400 })
      }
      updateData.title = data.title.trim()
    }

    if (data.content !== undefined) {
      if (!data.content?.trim()) {
        return NextResponse.json({ message: 'กรุณาระบุเนื้อหาประกาศ' }, { status: 400 })
      }
      updateData.content = data.content.trim()
    }

    if (data.type !== undefined) updateData.type = data.type
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
    if (data.image !== undefined) updateData.image = data.image

    const announcement = await prisma.announcement.update({
      where: { id: announcementId },
      data: updateData
    })

    return NextResponse.json({
      message: 'อัปเดตประกาศสำเร็จ',
      announcement: {
        _id: announcement.id.toString(),
        ...announcement
      }
    })
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการอัปเดตประกาศ',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

// DELETE /api/announcements
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ message: 'กรุณาระบุ ID ประกาศ' }, { status: 400 })
    }

    const announcementId = parseInt(id)
    if (isNaN(announcementId)) {
      return NextResponse.json({ message: 'ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: announcementId }
    })

    if (!existingAnnouncement) {
      return NextResponse.json({ message: 'ไม่พบประกาศ' }, { status: 404 })
    }

    await prisma.announcement.delete({
      where: { id: announcementId }
    })

    return NextResponse.json({
      message: 'ลบประกาศสำเร็จ'
    })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการลบประกาศ',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}