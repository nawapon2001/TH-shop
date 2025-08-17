// src/app/api/banners/route.ts
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { connectToDatabase } from '@/lib/mongodb'
import Banner from '@/models/Banner'

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
    await connectToDatabase()
    await Banner.create({
      filename,
      image: buffer,            // ถ้าสคีมามี Buffer ก็เก็บได้
      contentType: file.type,
      url: record.url,
      isSmall,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } catch (err) {
    console.error('MongoDB banner insert error:', err)
  }

  return NextResponse.json(record)
}

// GET /api/banners -> [{ _id, url, image, isSmall }]
export async function GET() {
  try {
    await connectToDatabase()
    const docs = await Banner.find({}, { filename: 1, url: 1, isSmall: 1 }).sort({ createdAt: 1 }).lean()
    if (docs?.length) {
      return NextResponse.json(
        docs.map((d: any) => ({
          _id: d.filename || String(d._id),
          url: d.url || (d.filename ? `/banners/${d.filename}` : ''),
          image: d.url || (d.filename ? `/banners/${d.filename}` : ''),
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
    await connectToDatabase()
    await Banner.deleteOne({ $or: [{ filename }, { _id: filename }] })
  } catch (err) {
    console.error('MongoDB banner delete error:', err)
  }

  return NextResponse.json({ ok: true })
}
