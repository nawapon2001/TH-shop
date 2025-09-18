import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

type ProductPayload = {
  username: string
  item?: {
    name: string
    price: number | string
    desc?: string
  image?: string
  images?: string[]
  options?: { name: string; values: string[] }[]
  }
}

/* GET /api/seller-products?username=... */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const username = url.searchParams.get('username')
    const id = url.searchParams.get('id')

    // GET by id
    if (id) {
      const numericId = parseInt(id)
      if (isNaN(numericId)) {
        return NextResponse.json(null, { status: 404 })
      }

      const product = await prisma.product.findUnique({
        where: { id: numericId },
        include: {
          seller: true,
          options: {
            include: {
              values: true
            }
          }
        }
      })

      if (!product) return NextResponse.json(null, { status: 404 })

      return NextResponse.json({
        _id: product.id,
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.image,
        images: product.images ? (Array.isArray(product.images) ? product.images : [product.images]) : [],
        category: product.category,
        username: product.sellerUsername,
        seller: product.seller?.username,
        options: product.options || [],
        rating: product.rating,
        sold: product.sold,
        stock: product.stock
      })
    }

    // GET by username
    if (username) {
      const products = await prisma.product.findMany({
        where: { sellerUsername: username },
        include: {
          seller: true,
          options: {
            include: {
              values: true
            }
          }
        }
      })

      const result = products.map(product => ({
        _id: product.id,
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.image,
        images: product.images ? (Array.isArray(product.images) ? product.images : [product.images]) : [],
        category: product.category,
        username: product.sellerUsername,
        seller: product.seller?.username,
        options: product.options || [],
        rating: product.rating,
        sold: product.sold,
        stock: product.stock
      }))

      return NextResponse.json(result)
    }

    // no filters -> return all seller products (products that have sellers)
    const allProducts = await prisma.product.findMany({
      where: {
        NOT: { sellerUsername: null }
      },
      include: {
        seller: true,
        options: {
          include: {
            values: true
          }
        }
      }
    })

    const resultAll = allProducts.map(product => ({
      _id: product.id,
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      image: product.image,
      images: product.images ? (Array.isArray(product.images) ? product.images : [product.images]) : [],
      category: product.category,
      username: product.sellerUsername,
      seller: product.seller?.username,
      options: product.options || [],
      rating: product.rating,
      sold: product.sold,
      stock: product.stock
    }))

    return NextResponse.json(resultAll)
  } catch (err) {
    console.error('GET /api/seller-products error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

/* POST create product */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProductPayload
    if (!body?.username || !body?.item?.name) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
    }

    // Check if seller exists
    const seller = await prisma.seller.findUnique({
      where: { username: body.username }
    })

    const productData = {
      name: body.item.name,
      price: typeof body.item.price === 'string' ? 
        (Number(body.item.price) || 0) : 
        Number(body.item.price) || 0,
      description: body.item.desc || '',
      image: Array.isArray(body.item.images) && body.item.images.length ? 
        body.item.images[0] : 
        (body.item.image || ''),
      images: Array.isArray(body.item.images) ? body.item.images : 
        (body.item.image ? [body.item.image] : []),
      sellerUsername: body.username,
      sellerId: seller?.id || null,
      stock: 999 // default stock
    }

    const newProduct = await prisma.product.create({
      data: productData
    })

    return NextResponse.json({ ok: true, id: newProduct.id })
  } catch (err) {
    console.error('POST /api/seller-products error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

/* PUT update product */
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { username, productId, item } = body
    
    if (!username || !productId || !item) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
    }

    const numericId = parseInt(productId)
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'invalid product id' }, { status: 400 })
    }

    const updateData = {
      name: item.name,
      price: typeof item.price === 'string' ? 
        (Number(item.price) || 0) : 
        Number(item.price) || 0,
      category: item.category || '',
      description: item.desc || '',
    }

    const result = await prisma.product.updateMany({
      where: {
        id: numericId,
        sellerUsername: username
      },
      data: updateData
    })
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'product not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, modified: result.count })
  } catch (err) {
    console.error('PUT /api/seller-products error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

/* DELETE /api/seller-products?id=... */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const numericId = parseInt(id)
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 })
    }

    await prisma.product.delete({
      where: { id: numericId }
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/seller-products error', err)
    // Return error details during development to aid debugging
    return NextResponse.json({ error: 'internal error', message: (err as any)?.message, stack: (err as any)?.stack }, { status: 500 })
  }
}
