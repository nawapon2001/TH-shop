// src/app/api/banners/route.ts
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const uploadDir = path.join(process.cwd(), 'public', 'banners')

function parseBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v === 1
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    return s === '1' || s === 'true' || s === 'yes'
  }
  return false
}

// POST /api/banners  (รับได้ทั้ง 'banner' และ 'file')
export async function POST(req: NextRequest) {
  try {
    await fs.mkdir(uploadDir, { recursive: true })

    const formData = await req.formData()
    const file = (formData.get('banner') || formData.get('file')) as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const isSmall = parseBool(formData.get('isSmall'))

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const safeName = file.name.replace(/\\s+/g, '-')
    const filename = `${Date.now()}-${safeName}`
    const filePath = path.join(uploadDir, filename)
    await fs.writeFile(filePath, buffer)

    const record = {
      _id: filename,
      url: `/banners/${filename}`,
      image: `/banners/${filename}`,
      isSmall,
    }

    // เก็บข้อมูลใน database ด้วย Prisma
    try {
      await prisma.banner.create({
        data: {
          filename,
          url: record.url,
          image: buffer,
          contentType: file.type,
          isSmall,
        }
      })
    } catch (err) {
      console.error('Prisma banner insert error:', err)
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('Banner upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// GET /api/banners -> [{ _id, url, image, isSmall }]
export async function GET() {
  try {
    // ลองดึงข้อมูลจาก database ก่อน
    const banners = await prisma.banner.findMany({
      select: {
        filename: true,
        url: true,
        isSmall: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    if (banners && banners.length > 0) {
      return NextResponse.json(
        banners.map((banner) => ({
          _id: banner.filename,
          url: banner.url,
          image: banner.url,
          isSmall: banner.isSmall,
        }))
      )
    }
  } catch (error) {
    console.error('Database banner fetch error:', error)
    // fallback ลงที่ไฟล์ใน public/banners
  }

  try {
    const files = await fs.readdir(uploadDir)
    const list = files
      .filter((f) => !f.endsWith('.json'))
      .map((f) => ({ _id: f, url: `/banners/${f}`, image: `/banners/${f}`, isSmall: false }))
    return NextResponse.json(list)
  } catch {
    return NextResponse.json([])
  }
}

// DELETE /api/banners?id=<filename or id>
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const filename = path.basename(id)
    const filePath = path.join(uploadDir, filename)

    // ลบไฟล์
    try { 
      await fs.unlink(filePath) 
    } catch (error) {
      console.error('File deletion error:', error)
    }

    // ลบจาก database
    try {
      await prisma.banner.deleteMany({
        where: { filename }
      })
    } catch (err) {
      console.error('Prisma banner delete error:', err)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Banner deletion error:', error)
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
