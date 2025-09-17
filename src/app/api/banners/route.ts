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
  await fs.mkdir(uploadDir, { recursive: true })

  const formData = await req.formData()
  const file = (formData.get('banner') || formData.get('file')) as File | null
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const isSmall = parseBool(formData.get('isSmall'))

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const safeName = file.name.replace(/\s+/g, '-')
  const filename = `${Date.now()}-${safeName}`
  const filePath = path.join(uploadDir, filename)
  await fs.writeFile(filePath, buffer)

  const record = {
    _id: filename,
    url: `/banners/${filename}`,
    image: `/banners/${filename}`,
    isSmall,
  }

  // เก็บ DB (best-effort)
  try {
    await prisma.banner.create({
      data: {
        filename,
        contentType: file.type,
        url: record.url,
        isSmall,
      }
    })
  } catch (err) {
    console.error('Prisma banner insert error:', err)
  }

  return NextResponse.json(record)
}

// GET /api/banners -> [{ _id, url, image, isSmall }]
export async function GET() {
  try {
    const docs = await prisma.banner.findMany({
      select: {
        filename: true,
        url: true,
        isSmall: true
      },
      orderBy: { createdAt: 'asc' }
    })
    
    if (docs?.length) {
      return NextResponse.json(
        docs.map((d) => ({
          _id: d.filename,
          url: d.url,
          image: d.url,
          isSmall: !!d.isSmall,
        }))
      )
    }
  } catch {
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
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const filename = path.basename(id)
  const filePath = path.join(uploadDir, filename)

  try { await fs.unlink(filePath) } catch {}

  try {
    // Use deleteMany to avoid failing when filename isn't unique or when DB record is missing
    await prisma.banner.deleteMany({ where: { filename } })
  } catch (err) {
    console.error('Prisma banner delete error:', err)
    return NextResponse.json({ error: 'internal error', message: (err as any)?.message, stack: (err as any)?.stack }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
