import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type ProductOptionValue = { 
  value: string; 
  price?: number; // ราคาเพิ่มเติม หรือ ราคาเฉพาะของตัวเลือกนี้
  priceType?: 'add' | 'replace'; // 'add' = เพิ่มจากราคาหลัก, 'replace' = แทนที่ราคาหลัก
}

type ProductOption = { 
  name: string; 
  values: ProductOptionValue[] 
}

const ensureString = (v: unknown) => (v == null ? '' : String(v).trim())

function sanitizeOptions(raw: any): ProductOption[] {
  try {
    // Handle both string and already parsed arrays
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
        
        // แปลง values ให้เป็น ProductOptionValue[]
        const values: ProductOptionValue[] = valuesRaw
          .map((v: any) => {
            if (!v) return null
            
            // รองรับทั้งแบบ string เดิม และแบบ object ใหม่
            if (typeof v === 'string') {
              return { 
                value: ensureString(v), 
                price: 0, 
                priceType: 'add' as const 
              }
            } else if (typeof v === 'object' && v !== null) {
              const value = ensureString(v.value)
              if (!value) return null
              
              const price = Number(v.price) || 0
              const priceType = (v.priceType === 'replace' ? 'replace' : 'add') as 'add' | 'replace'
              
              return {
                value,
                price: Math.max(0, price), // ป้องกันราคาติดลบ
                priceType
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
        // ป้องกันชื่อตัวเลือกซ้ำ
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

    // Try connecting to database
    let useMongoose = true
    try {
      await connectToDatabase()
    } catch (mongooseError) {
      console.warn('Mongoose connection failed, trying raw MongoDB client:', mongooseError)
      useMongoose = false
    }

    // Parse request data
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
        if (value.price < 0) {
          return NextResponse.json({ message: `ราคาของตัวเลือก "${option.name}: ${value.value}" ไม่สามารถน้อยกว่า 0 ได้` }, { status: 400 })
        }
        if (!['add', 'replace'].includes(value.priceType)) {
          return NextResponse.json({ message: `ประเภทราคาของตัวเลือก "${option.name}: ${value.value}" ไม่ถูกต้อง` }, { status: 400 })
        }
      }
    }

    const productData = {
      name: name.trim(),
      price,
      category: category.trim(),
      description: description.trim(),
      image: images[0] || '',
      images,
      options,
      rating: 0,
      reviews: 0,
      sold: 0,
      discountPercent: 0,
      deliveryInfo: '',
      promotions: [],
      stock: 999,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (useMongoose) {
      // Use Mongoose
      try {
        const doc = new Product(productData)
        console.log('Creating product with Mongoose:', { name, price, category, description, optionsCount: options.length })
        await doc.save()
        console.log('Product saved successfully with ID:', doc._id?.toString())
        return NextResponse.json({ message: 'เพิ่มสินค้าแล้ว', id: doc._id?.toString() })
      } catch (mongooseError) {
        console.error('Mongoose save failed:', mongooseError)
        useMongoose = false
      }
    }

    if (!useMongoose) {
      // Fallback to raw MongoDB client
      try {
        const client = await clientPromise
        if (!client) {
          return NextResponse.json({ message: 'ไม่สามารถเชื่อมต่อฐานข้อมูล' }, { status: 500 })
        }
        
        const db = client.db('signshop')
        const result = await db.collection('products').insertOne(productData)
        console.log('Product saved with raw MongoDB client:', result.insertedId)
        return NextResponse.json({ message: 'เพิ่มสินค้าแล้ว', id: result.insertedId.toString() })
      } catch (clientError) {
        console.error('Raw MongoDB client failed:', clientError)
        throw clientError
      }
    }
    
    return NextResponse.json({ message: 'เพิ่มสินค้าแล้ว' })
  } catch (err) {
    console.error('Error adding product:', err)
    
    // Handle specific errors
    if (err instanceof Error) {
      if (err.name === 'ValidationError') {
        return NextResponse.json({ message: `ข้อมูลไม่ถูกต้อง: ${err.message}` }, { status: 400 })
      }
      if (err.message.includes('duplicate key')) {
        return NextResponse.json({ message: 'สินค้านี้มีอยู่ในระบบแล้ว' }, { status: 400 })
      }
      if (err.message.includes('ECONNREFUSED') || err.message.includes('MongoNetworkError')) {
        return NextResponse.json({ message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' }, { status: 500 })
      }
    }
    
    return NextResponse.json({ message: 'เพิ่มสินค้าไม่สำเร็จ' }, { status: 500 })
  }
}

// เพิ่มฟังก์ชัน normalize สำหรับ GET
function normalizeOptionsForOutput(raw: any): any[] {
  if (!raw || !Array.isArray(raw)) return []
  
  return raw.map((option: any) => {
    if (!option || typeof option !== 'object') return option
    
    return {
      name: option.name || '',
      values: Array.isArray(option.values) ? option.values.map((v: any) => {
        // ถ้าเป็น object ให้ส่งข้อมูลราคาด้วย
        if (typeof v === 'object' && v !== null && v.value) {
          return {
            value: v.value,
            price: v.price || 0,
            priceType: v.priceType || 'add'
          }
        }
        // ถ้าเป็น string ให้แปลงเป็น object
        return {
          value: v,
          price: 0,
          priceType: 'add'
        }
      }) : []
    }
  })
}

export async function GET() {
  try {
    // Try Mongoose first
    try {
      await connectToDatabase()
      const products = await Product.find().lean()
      // Normalize options ก่อนส่งกลับ
      const normalizedProducts = products.map((product: any) => ({
        ...product,
        options: normalizeOptionsForOutput(product.options)
      }))
      return NextResponse.json(normalizedProducts)
    } catch (mongooseError) {
      console.warn('Mongoose failed, trying raw MongoDB client:', mongooseError)
    }

    // Fallback to raw MongoDB client
    const client = await clientPromise
    if (!client) {
      return NextResponse.json({ message: 'ไม่สามารถเชื่อมต่อฐานข้อมูล' }, { status: 500 })
    }
    
    const db = client.db('signshop')
    const products = await db.collection('products').find({}).toArray()
    // Normalize options ก่อนส่งกลับ
    const normalizedProducts = products.map((product: any) => ({
      ...product,
      options: normalizeOptionsForOutput(product.options)
    }))
    return NextResponse.json(normalizedProducts)
  } catch (err) {
    console.error('Error fetching products:', err)
    return NextResponse.json({ message: 'ดึงสินค้าไม่สำเร็จ' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'กรุณาระบุ id สินค้า' }, { status: 400 })
    const result = await Product.deleteOne({ _id: id })
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'ไม่พบสินค้าที่ต้องการลบ' }, { status: 404 })
    }
    return NextResponse.json({ message: 'ลบสินค้าแล้ว' })
  } catch (err) {
    console.error('Error deleting product:', err)
    return NextResponse.json({ message: 'ลบสินค้าไม่สำเร็จ' }, { status: 500 })
  }
}
