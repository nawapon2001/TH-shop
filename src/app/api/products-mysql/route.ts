import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type ProductOptionValue = {
  value: string
  price?: number
  priceType?: 'add' | 'replace'
  stock?: number
  sku?: string
}

type ProductOption = {
  name: string
  values: ProductOptionValue[]
}

const ensureString = (v: unknown) => (v == null ? '' : String(v).trim())

function sanitizeOptions(raw: any): ProductOption[] {
  try {
    let parsed: any
    if (typeof raw === 'string') {
      parsed = JSON.parse(raw || '[]')
    } else if (Array.isArray(raw)) {
      parsed = raw
    } else {
      return []
    }
    
    const data: any[] = Array.isArray(parsed) ? parsed : []
    const seen = new Set<string>()
    
    const list = data
      .map((o: any) => {
        if (!o || typeof o !== 'object') return null
        
        const name = ensureString(o?.name)
        if (!name) return null
        
        const valuesRaw = Array.isArray(o?.values) ? o.values : []
        
        const values: ProductOptionValue[] = valuesRaw
          .map((v: any) => {
            if (!v) return null
            
            if (typeof v === 'string') {
              return { 
                value: ensureString(v), 
                price: 0, 
                priceType: 'add' as const,
                stock: 0
              }
            } else if (typeof v === 'object' && v !== null) {
              const value = ensureString(v.value)
              if (!value) return null
              
              const price = Number(v.price) || 0
              const priceType = (v.priceType === 'replace' ? 'replace' : 'add') as 'add' | 'replace'
              const stock = Number(v.stock) || 0
              const sku = ensureString(v.sku)
              
              return {
                value,
                price: Math.max(0, price),
                priceType,
                stock: Math.max(0, stock),
                sku
              }
            }
            return null
          })
          .filter((v: any) => v !== null && v.value.trim() !== '')

        if (values.length === 0) return null

        return { name: name.trim(), values }
      })
      .filter((o: any) => o !== null)
      .map((o: any) => {
        let name = o.name as string
        let n = 2
        while (seen.has(name)) {
          name = `${o.name} (${n++})`
        }
        seen.add(name)
        return { name, values: o.values as ProductOptionValue[] }
      })
      
    return list as ProductOption[]
  } catch (error) {
    console.error('Error sanitizing options:', error)
    return []
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    console.log('Content-Type:', contentType)

    let name: string, price: number, category: string, description: string, images: string[] = [], optionsRaw: any

    if (contentType.includes('multipart/form-data')) {
      console.log('Processing multipart/form-data')
      const formData = await req.formData()
      name = ensureString(formData.get('name'))
      price = Number(formData.get('price'))
      category = ensureString(formData.get('category'))
      description = ensureString(formData.get('description'))

      const files = formData.getAll('images') as File[]
      for (const f of files) {
        if (f && f instanceof File) {
          const buf = Buffer.from(await f.arrayBuffer())
          images.push(`data:${f.type};base64,${buf.toString('base64')}`)
        }
      }

      optionsRaw = formData.get('options')
    } else {
      console.log('Processing application/json')
      const data = await req.json()
      console.log('Received data:', JSON.stringify(data, null, 2))
      
      name = data?.name || ''
      price = Number(data?.price) || 0
      category = data?.category || ''
      description = data?.description || ''
      images = Array.isArray(data?.images) ? data.images : []
      optionsRaw = data?.options
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'กรุณาระบุชื่อสินค้า' }, { status: 400 })
    }
    if (!price || price <= 0) {
      return NextResponse.json({ message: 'กรุณาระบุราคาสินค้าที่ถูกต้อง' }, { status: 400 })
    }

    const options = sanitizeOptions(optionsRaw)
    console.log('Sanitized options:', JSON.stringify(options, null, 2))
    
    // Validate options structure
    for (const option of options) {
      if (!option.name || !option.name.trim()) {
        return NextResponse.json({ message: 'กรุณาระบุชื่อตัวเลือกให้ถูกต้อง' }, { status: 400 })
      }
      if (!Array.isArray(option.values) || option.values.length === 0) {
        return NextResponse.json({ message: `ตัวเลือก "${option.name}" ต้องมีค่าอย่างน้อย 1 ค่า` }, { status: 400 })
      }
      for (const value of option.values) {
        if (!value.value || !value.value.trim()) {
          return NextResponse.json({ message: `กรุณาระบุค่าของตัวเลือก "${option.name}" ให้ถูกต้อง` }, { status: 400 })
        }
        
        const price = value.price ?? 0
        if (price < 0) {
          return NextResponse.json({ message: `ราคาของตัวเลือก "${option.name}: ${value.value}" ไม่สามารถน้อยกว่า 0 ได้` }, { status: 400 })
        }

        const priceType = value.priceType || 'add'
        if (!['add', 'replace'].includes(priceType)) {
          return NextResponse.json({ message: `ประเภทราคาของตัวเลือก "${option.name}: ${value.value}" ไม่ถูกต้อง` }, { status: 400 })
        }

        const stock = value.stock ?? 0
        if (stock < 0) {
          return NextResponse.json({ message: `สต็อกของตัวเลือก "${option.name}: ${value.value}" ไม่สามารถน้อยกว่า 0 ได้` }, { status: 400 })
        }
      }
    }

    // Create product with Prisma
    try {
      const product = await prisma.product.create({
        data: {
          name: name.trim(),
          price,
          category: category.trim() || null,
          description: description.trim() || null,
          image: images[0] || null,
          images: images.length > 0 ? images : null,
          rating: 0,
          reviews: 0,
          sold: 0,
          discountPercent: 0,
          deliveryInfo: null,
          promotions: null,
          stock: 999,
          options: {
            create: options.map(option => ({
              name: option.name,
              values: {
                create: option.values.map(value => ({
                  value: value.value,
                  price: value.price || 0,
                  priceType: value.priceType || 'add',
                  stock: value.stock || 0,
                  sku: value.sku || null
                }))
              }
            }))
          }
        },
        include: {
          options: {
            include: {
              values: true
            }
          }
        }
      })

      console.log('Product created successfully with ID:', product.id)
      return NextResponse.json({ 
        message: 'เพิ่มสินค้าแล้ว', 
        id: product.id.toString(),
        product 
      })
    } catch (prismaError) {
      console.error('Prisma error:', prismaError)
      return NextResponse.json({ 
        message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        error: process.env.NODE_ENV === 'development' ? String(prismaError) : undefined
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการประมวลผล',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        options: {
          include: {
            values: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
