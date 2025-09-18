import { PrismaClient } from './src/generated/prisma'

const prisma = new PrismaClient()

async function cleanTestData() {
  console.log('🧹 Removing test data and keeping only real data...')

  try {
    // Remove products created by testshop (seed data)
    const deletedProducts = await prisma.product.deleteMany({
      where: {
        sellerUsername: 'testshop'
      }
    })
    console.log(`Deleted ${deletedProducts.count} test products`)

    // Remove testshop seller
    const deletedSeller = await prisma.seller.deleteMany({
      where: {
        username: 'testshop'
      }
    })
    console.log(`Deleted ${deletedSeller.count} test seller`)

    // Remove test categories (keep original ones)
    const deletedCategories = await prisma.category.deleteMany({
      where: {
        OR: [
          { name: 'อาหาร' },
          { name: 'เทคโนโลยี' },
          { name: 'แฟชั่น' }
        ]
      }
    })
    console.log(`Deleted ${deletedCategories.count} test categories`)

    console.log('✅ Test data cleanup completed!')

    // Show remaining real data
    const remainingProducts = await prisma.product.findMany({
      include: { seller: true }
    })
    console.log(`\n📦 Remaining real products: ${remainingProducts.length}`)
    remainingProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ฿${product.price}`)
      console.log(`   Image: ${product.image || 'No image'}`)
      console.log(`   Seller: ${product.sellerUsername || 'No seller'}`)
      console.log(`   Category: ${product.category || 'No category'}`)
      console.log('   ---')
    })

  } catch (error) {
    console.error('❌ Error cleaning test data:', error)
  }
}

cleanTestData()
  .finally(async () => {
    await prisma.$disconnect()
  })