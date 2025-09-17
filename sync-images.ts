import { PrismaClient } from './src/generated/prisma'
import { readdir } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function syncWithRealFiles() {
  console.log('🔄 Syncing database with actual image files...')

  try {
    // Get all files in uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const files = await readdir(uploadsDir)
    const imageFiles = files.filter(file => 
      file.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    ).slice(0, 10) // Take first 10 images

    console.log(`Found ${imageFiles.length} image files`)

    // Get existing products with no seller assigned (real data but incomplete)
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { sellerUsername: null },
          { sellerUsername: '' }
        ]
      }
    })

    console.log(`Found ${products.length} products without sellers`)

    // Update products with real image files
    for (let i = 0; i < Math.min(products.length, imageFiles.length); i++) {
      const product = products[i]
      const imageFile = imageFiles[i]
      const imagePath = `/uploads/${imageFile}`

      await prisma.product.update({
        where: { id: product.id },
        data: {
          image: imagePath,
          images: [imagePath]
        }
      })

      console.log(`Updated ${product.name} with image: ${imagePath}`)
    }

    // If we have more images than products, create some new products
    if (imageFiles.length > products.length) {
      const remainingImages = imageFiles.slice(products.length)
      
      for (let i = 0; i < remainingImages.length; i++) {
        const imageFile = remainingImages[i]
        const imagePath = `/uploads/${imageFile}`
        
        await prisma.product.create({
          data: {
            name: `สินค้า ${i + products.length + 1}`,
            price: Math.floor(Math.random() * 1000) + 10,
            category: 'อื่นๆ',
            description: `สินค้าตัวอย่าง ${i + products.length + 1}`,
            image: imagePath,
            images: [imagePath],
            rating: Math.floor(Math.random() * 5),
            reviews: Math.floor(Math.random() * 100),
            sold: Math.floor(Math.random() * 50),
            stock: Math.floor(Math.random() * 100) + 10
          }
        })

        console.log(`Created new product with image: ${imagePath}`)
      }
    }

    // Show final result
    const finalProducts = await prisma.product.findMany()
    console.log(`\n✅ Database sync completed!`)
    console.log(`Total products: ${finalProducts.length}`)
    
    finalProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ฿${product.price}`)
      console.log(`   Image: ${product.image}`)
      console.log('   ---')
    })

  } catch (error) {
    console.error('❌ Error syncing database:', error)
  }
}

syncWithRealFiles()
  .finally(async () => {
    await prisma.$disconnect()
  })