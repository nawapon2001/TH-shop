import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'

type ProductOption = { name: string; values: string[] }

const ensureString = (v: unknown) => (v == null ? '' : String(v).trim())
function sanitizeOptions(raw: any): ProductOption[] {
  try {
    const data = Array.isArray(raw) ? raw : JSON.parse(String(raw || '[]'))
    if (!Array.isArray(data)) return []
    const seen = new Set<string>()
    const list = data
      .map((o: any) => ({
        name: ensureString(o?.name),
        values: Array.from(
          new Set((Array.isArray(o?.values) ? o.values : []).map(ensureString).filter(Boolean))
        ),
      }))
      .filter((o: ProductOption) => o.name && o.values.length > 0)
      .map((o: ProductOption) => {
        let name = o.name
        let n = 2
        while (seen.has(name)) name = `${o.name} (${n++})`
        seen.add(name)
        return { ...o, name }
      })
    return list
  } catch {
    return []
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase()
    const contentType = req.headers.get('content-type') || ''

    // --- multipart/form-data ---
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const name = ensureString(formData.get('name'))
      const price = Number(formData.get('price'))
      const category = ensureString(formData.get('category'))
      const description = ensureString(formData.get('description'))

      // images
      const files = formData.getAll('images') as File[]
      const images: string[] = []
      for (const f of files) {
        if (f && f instanceof File) {
          const buf = Buffer.from(await f.arrayBuffer())
          images.push(`data:${f.type};base64,${buf.toString('base64')}`)
        }
      }
      const image = images[0] || ''

      // ✅ options
      const optionsRaw = formData.get('options')
      const options = sanitizeOptions(optionsRaw)

      const doc = new Product({ name, price, category, description, image, images, options })
      await doc.save()
      return NextResponse.json({ message: 'เพิ่มสินค้าแล้ว', id: doc._id })
    }

    // --- application/json ---
    const data = await req.json()
    const {
      name, price, category, description,
      image, images = [], options: optionsRaw
    } = data || {}

    const options = sanitizeOptions(optionsRaw)
    const doc = new Product({ name, price, category, description, image, images, options })
    await doc.save()
    return NextResponse.json({ message: 'เพิ่มสินค้าแล้ว', id: doc._id })
  } catch (err) {
    console.error('Error adding product:', err)
    return NextResponse.json({ message: 'เพิ่มสินค้าไม่สำเร็จ' }, { status: 500 })
  }
}

export async function GET() {
  try {
    await connectToDatabase()
    const products = await Product.find().lean()
    return NextResponse.json(products)
  } catch {
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
