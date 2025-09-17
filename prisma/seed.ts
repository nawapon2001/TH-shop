import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create some sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'อาหาร' },
      update: {},
      create: {
        name: 'อาหาร',
        description: 'อาหารและเครื่องดื่ม',
        icon: '/file.svg',
        iconType: 'system'
      }
    }),
    prisma.category.upsert({
      where: { name: 'เทคโนโลยี' },
      update: {},
      create: {
        name: 'เทคโนโลยี',
        description: 'อุปกรณ์อิเล็กทรอนิกส์',
        icon: '/file.svg',
        iconType: 'system'
      }
    }),
    prisma.category.upsert({
      where: { name: 'แฟชั่น' },
      update: {},
      create: {
        name: 'แฟชั่น',
        description: 'เสื้อผ้าและเครื่องประดับ',
        icon: '/file.svg',
        iconType: 'system'
      }
    })
  ])

  // Create a sample seller
  const seller = await prisma.seller.upsert({
    where: { username: 'testshop' },
    update: {},
    create: {
      username: 'testshop',
      shopName: 'ร้านทดสอบ',
      fullName: 'เจ้าของร้านทดสอบ',
      email: 'testshop@example.com',
      phone: '0123456789',
      description: 'ร้านขายสินค้าหลากหลาย'
    }
  })

  // Create sample products with images
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'โจ๊กป้ายแดง',
        price: 1,
        category: 'อาหาร',
        description: 'โจ๊กป้ายแดงอร่อยถูกใจ',
        image: '/uploads/1755705685523-2ffbo2mq68x-okZ3P1KsbyWNY9AEWAvAbKp1nirBoiABD0lIR_tplv-sdweummd6v-text-logo-v1_QGFvZjI4OQ___q75.jpeg',
        images: ['/uploads/1755705685523-2ffbo2mq68x-okZ3P1KsbyWNY9AEWAvAbKp1nirBoiABD0lIR_tplv-sdweummd6v-text-logo-v1_QGFvZjI4OQ___q75.jpeg'],
        rating: 4.5,
        reviews: 10,
        sold: 50,
        stock: 100,
        sellerId: seller.id,
        sellerUsername: seller.username
      }
    }),
    prisma.product.create({
      data: {
        name: 'ทดสอบอื่น',
        price: 10,
        category: 'อาหาร',
        description: 'สินค้าทดสอบ',
        image: '/uploads/1755705685527-zh37l5mv0l-33E8035C-2694-4364-B078-E856353FCEDF.jpg',
        images: ['/uploads/1755705685527-zh37l5mv0l-33E8035C-2694-4364-B078-E856353FCEDF.jpg'],
        rating: 4.0,
        reviews: 5,
        sold: 25,
        stock: 50,
        sellerId: seller.id,
        sellerUsername: seller.username
      }
    }),
    prisma.product.create({
      data: {
        name: 'ads',
        price: 500,
        category: 'เทคโนโลยี',
        description: 'โฆษณา',
        image: '/uploads/1756012642120-0286q3vctjdq-ChatGPT_Image_21__._._2568_21_15_27.png',
        images: ['/uploads/1756012642120-0286q3vctjdq-ChatGPT_Image_21__._._2568_21_15_27.png'],
        rating: 0,
        reviews: 0,
        sold: 0,
        stock: 999,
        sellerId: seller.id,
        sellerUsername: seller.username
      }
    }),
    prisma.product.create({
      data: {
        name: 'Mysql',
        price: 500,
        category: 'เทคโนโลยี',
        description: 'ฐานข้อมูล MySQL',
        image: '/uploads/1757832284861-2cu52tdzj7f-psd1.jpg',
        images: ['/uploads/1757832284861-2cu52tdzj7f-psd1.jpg'],
        rating: 0,
        reviews: 0,
        sold: 0,
        stock: 999,
        sellerId: seller.id,
        sellerUsername: seller.username
      }
    }),
    prisma.product.create({
      data: {
        name: 'บ้านคลองไผ่มีนมอล',
        price: 500,
        category: 'อาหาร',
        description: 'นมสดจากบ้านคลองไผ่',
        image: '/uploads/1757839397605-ddrtmrbinw-ChatGPT_Image_21__._._2568_21_15_27.png',
        images: ['/uploads/1757839397605-ddrtmrbinw-ChatGPT_Image_21__._._2568_21_15_27.png'],
        rating: 0,
        reviews: 0,
        sold: 0,
        stock: 999,
        sellerId: seller.id,
        sellerUsername: seller.username
      }
    })
  ])

  console.log('✅ Database seeded successfully!')
  console.log(`Created ${categories.length} categories`)
  console.log(`Created 1 seller: ${seller.shopName}`)
  console.log(`Created ${products.length} products`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })