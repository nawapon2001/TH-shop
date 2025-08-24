import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// runtime must be a statically analyzable value; Next expects 'nodejs' for Node runtime
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const entries = Array.from(formData.entries())
    const files: File[] = []
    for (const [, value] of entries) {
      if (value instanceof File) files.push(value)
      else if (Array.isArray(value)) {
        value.forEach(v => { if (v instanceof File) files.push(v) })
      }
    }

    if (!files.length) return NextResponse.json({ urls: [] })

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.promises.mkdir(uploadDir, { recursive: true })

    const urls: string[] = []
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      // sanitize filename
      const base = (file.name || 'file').replace(/[^\w.-]/g, '_')
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${base}`
      const filepath = path.join(uploadDir, filename)
      await fs.promises.writeFile(filepath, buffer)
      urls.push(`/uploads/${filename}`)
    }

    return NextResponse.json({ urls })
  } catch (err) {
    console.error('upload error', err)
    return NextResponse.json({ message: 'upload error' }, { status: 500 })
  }
}
