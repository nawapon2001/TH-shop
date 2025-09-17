import { PrismaClient } from './src/generated/prisma'

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('🔍 Checking current database content...')

  try {
    // Check products
    const products = await prisma.product.findMany({
      include: {
        seller: true,
        options: true
      }
    })
    console.log(`\n📦 Products found: ${products.length}`)
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`)
      console.log(`   Price: ฿${product.price}`)
      console.log(`   Image: ${product.image || 'No image'}`)
      console.log(`   Images: ${product.images ? JSON.stringify(product.images) : 'No images'}`)
      console.log(`   Seller: ${product.sellerUsername || 'No seller'}`)
      console.log(`   Category: ${product.category || 'No category'}`)
      console.log('   ---')
    })

    // Check sellers
    const sellers = await prisma.seller.findMany()
    console.log(`\n👥 Sellers found: ${sellers.length}`)
    sellers.forEach((seller, index) => {
      console.log(`${index + 1}. ${seller.username} - ${seller.shopName || 'No shop name'}`)
    })

    // Check categories
    const categories = await prisma.category.findMany()
    console.log(`\n📂 Categories found: ${categories.length}`)
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} - ${category.description || 'No description'}`)
    })

    // Check banners
    const banners = await prisma.banner.findMany()
    console.log(`\n🖼️ Banners found: ${banners.length}`)
    banners.forEach((banner, index) => {
      console.log(`${index + 1}. ${banner.filename} - ${banner.url}`)
    })

  } catch (error) {
    console.error('❌ Error checking database:', error)
  }
}

checkDatabase()
  .finally(async () => {
    await prisma.$disconnect()
  })