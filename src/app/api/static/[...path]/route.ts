// API สำหรับ serve static files แบบ dynamic
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const filePath = params.path.join('/')
    
    // ตรวจสอบว่าเป็น banners หรือ uploads
    let folder: string
    let actualFileName: string
    
    if (filePath.startsWith('banners/')) {
      folder = 'banners'
      actualFileName = filePath.replace('banners/', '')
    } else if (filePath.startsWith('uploads/')) {
      folder = 'uploads'
      actualFileName = filePath.replace('uploads/', '')
    } else {
      return NextResponse.json({ error: 'Invalid path' }, { status: 404 })
    }

    // ลองหาไฟล์จริงในโฟลเดอร์
    const publicDir = path.join(process.cwd(), 'public', folder)
    const files = fs.readdirSync(publicDir)
    
    // หาไฟล์ที่มีชื่อคล้ายกัน (ตัดเลขข้างหน้าออก)
    let foundFile = files.find(file => file === actualFileName)
    
    if (!foundFile) {
      // ถ้าไม่เจอ ลองหาแบบ partial match (ตัดเลขข้างหน้าออก)
      const baseFileName = actualFileName.replace(/^\d+-/, '')
      foundFile = files.find(file => file.endsWith(baseFileName) || file === baseFileName)
    }

    if (!foundFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fullPath = path.join(publicDir, foundFile)
    
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(fullPath)
    const ext = path.extname(foundFile).toLowerCase()
    
    // กำหนด content type
    let contentType = 'application/octet-stream'
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.webp':
        contentType = 'image/webp'
        break
      case '.svg':
        contentType = 'image/svg+xml'
        break
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache 1 year
      },
    })
  } catch (error) {
    console.error('Static file serve error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}