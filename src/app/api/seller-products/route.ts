import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type ProductPayload = {
  username: string
  item?: {
    name: string
    price: number | string
    desc?: string
    image?: string
    images?: string[]
    options?: { name: string; values: any[] }[]
  }
}

/* GET /api/seller-products?username=...&id=... */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const username = url.searchParams.get('username')
    const id = url.searchParams.get('id')

    // GET by id
    if (id) {
      const productId = parseInt(id)
      if (isNaN(productId)) {
        return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          options: {
            include: {
              values: true
            }
          },
          seller: true
        }
      })

      if (!product) {
        return NextResponse.json(null, { status: 404 })
      }

      // Transform data to match frontend expectations
      const transformedProduct = {
        _id: product.id.toString(),
        ...product,
        images: Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []),
        options: product.options.map(option => ({
          name: option.name,
          values: option.values.map(value => ({
            value: value.value,
            price: value.price,
            priceType: value.priceType,
            stock: value.stock,
            sku: value.sku
          }))
        })),
        image: product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '')
      }

      return NextResponse.json(transformedProduct)
    }

    // GET by username
    if (!username) {
      return NextResponse.json({ error: 'username required' }, { status: 400 })
    }

    const products = await prisma.product.findMany({
      where: { sellerUsername: username },
      include: {
        options: {
          include: {
            values: true
          }
        },
        seller: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data to match frontend expectations
    const transformedProducts = products.map(product => ({
      _id: product.id.toString(),
      ...product,
      images: Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []),
      options: product.options.map(option => ({
        name: option.name,
        values: option.values.map(value => ({
          value: value.value,
          price: value.price,
          priceType: value.priceType,
          stock: value.stock,
          sku: value.sku
        }))
      })),
      image: product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '')
    }))

    return NextResponse.json(transformedProducts)
  } catch (error) {
    console.error('GET /api/seller-products error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

/* POST /api/seller-products */
export async function POST(req: Request) {
  try {
    const body: ProductPayload = await req.json()
    const { username, item } = body

    if (!username || !item) {
      return NextResponse.json({ error: 'username and item are required' }, { status: 400 })
    }

    if (!item.name || !item.price) {
      return NextResponse.json({ error: 'name and price are required' }, { status: 400 })
    }

    // Find seller
    const seller = await prisma.seller.findUnique({
      where: { username }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Prepare product data
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price
    const images = Array.isArray(item.images) ? item.images : (item.image ? [item.image] : [])
    const options = Array.isArray(item.options) ? item.options : []

    // Create product
    const product = await prisma.product.create({
      data: {
        name: item.name,
        price,
        description: item.desc || null,
        image: images[0] || null,
        images: images.length > 0 ? images : undefined,
        sellerId: seller.id,
        sellerUsername: username,
        options: {
          create: options.map(option => ({
            name: option.name,
            values: {
              create: Array.isArray(option.values) ? option.values.map((value: any) => {
                if (typeof value === 'string') {
                  return {
                    value,
                    price: 0,
                    priceType: 'add',
                    stock: 0
                  }
                } else {
                  return {
                    value: value.value || String(value),
                    price: value.price || 0,
                    priceType: value.priceType || 'add',
                    stock: value.stock || 0,
                    sku: value.sku || null
                  }
                }
              }) : []
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

    return NextResponse.json({
      ok: true,
      _id: product.id.toString(),
      product: {
        _id: product.id.toString(),
        ...product
      }
    })
  } catch (error) {
    console.error('POST /api/seller-products error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

/* PUT /api/seller-products */
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, username, item } = body

    if (!id || !username || !item) {
      return NextResponse.json({ error: 'id, username and item are required' }, { status: 400 })
    }

    const productId = parseInt(id)
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    // Verify product belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerUsername: username
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 })
    }

    // Update product
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price
    const images = Array.isArray(item.images) ? item.images : (item.image ? [item.image] : [])
    const options = Array.isArray(item.options) ? item.options : []

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: item.name,
        price,
        description: item.desc || null,
        image: images[0] || null,
        images: images.length > 0 ? images : undefined,
        // Update options
        options: {
          deleteMany: {}, // Clear existing options
          create: options.map((option: any) => ({
            name: option.name,
            values: {
              create: Array.isArray(option.values) ? option.values.map((value: any) => {
                if (typeof value === 'string') {
                  return {
                    value,
                    price: 0,
                    priceType: 'add',
                    stock: 0
                  }
                } else {
                  return {
                    value: value.value || String(value),
                    price: value.price || 0,
                    priceType: value.priceType || 'add',
                    stock: value.stock || 0,
                    sku: value.sku || null
                  }
                }
              }) : []
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

    return NextResponse.json({
      ok: true,
      product: {
        _id: updatedProduct.id.toString(),
        ...updatedProduct
      }
    })
  } catch (error) {
    console.error('PUT /api/seller-products error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

/* DELETE /api/seller-products */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const username = url.searchParams.get('username')

    if (!id || !username) {
      return NextResponse.json({ error: 'id and username are required' }, { status: 400 })
    }

    const productId = parseInt(id)
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    // Verify product belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerUsername: username
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 })
    }

    // Delete product (options will be deleted automatically due to cascade)
    await prisma.product.delete({
      where: { id: productId }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/seller-products error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
