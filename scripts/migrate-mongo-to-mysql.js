/**
 * สคริปต์สำหรับย้ายข้อมูลจาก MongoDB ไป MySQL
 * รันด้วย: node scripts/migrate-mongo-to-mysql.js
 */

const { PrismaClient } = require('@prisma/client')
const { MongoClient } = require('mongodb')

const prisma = new PrismaClient()

// กำหนดค่าการเชื่อมต่อ MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-mongo-db'

async function migrateProducts() {
  const mongoClient = new MongoClient(MONGODB_URI)
  
  try {
    console.log('เชื่อมต่อ MongoDB...')
    await mongoClient.connect()
    const mongoDb = mongoClient.db()
    const productsCollection = mongoDb.collection('products')
    
    console.log('ดึงข้อมูลสินค้าจาก MongoDB...')
    const mongoProducts = await productsCollection.find({}).toArray()
    
    console.log(`พบสินค้า ${mongoProducts.length} รายการใน MongoDB`)
    
    for (const mongoProduct of mongoProducts) {
      try {
        console.log(`กำลังย้าย: ${mongoProduct.name}`)
        
        // แปลงข้อมูล options จาก MongoDB format เป็น MySQL format
        const options = []
        if (mongoProduct.options && Array.isArray(mongoProduct.options)) {
          for (const option of mongoProduct.options) {
            const optionData = {
              name: option.name,
              values: []
            }
            
            if (option.values && Array.isArray(option.values)) {
              for (const value of option.values) {
                if (typeof value === 'string') {
                  optionData.values.push({
                    value: value,
                    price: 0,
                    priceType: 'add',
                    stock: 0,
                    sku: null
                  })
                } else if (typeof value === 'object' && value !== null) {
                  optionData.values.push({
                    value: value.value || '',
                    price: value.price || 0,
                    priceType: value.priceType || 'add',
                    stock: value.stock || 0,
                    sku: value.sku || null
                  })
                }
              }
            }
            
            if (optionData.values.length > 0) {
              options.push(optionData)
            }
          }
        }
        
        // สร้างสินค้าใน MySQL
        const createdProduct = await prisma.product.create({
          data: {
            name: mongoProduct.name || 'ไม่มีชื่อ',
            price: Number(mongoProduct.price) || 0,
            category: mongoProduct.category || null,
            description: mongoProduct.description || null,
            image: mongoProduct.image || null,
            images: mongoProduct.images || null,
            rating: Number(mongoProduct.rating) || 0,
            reviews: Number(mongoProduct.reviews) || 0,
            sold: Number(mongoProduct.sold) || 0,
            discountPercent: Number(mongoProduct.discountPercent) || 0,
            deliveryInfo: mongoProduct.deliveryInfo || null,
            promotions: mongoProduct.promotions || null,
            stock: Number(mongoProduct.stock) || 999,
            createdAt: mongoProduct.createdAt || new Date(),
            updatedAt: mongoProduct.updatedAt || new Date(),
            options: {
              create: options.map(option => ({
                name: option.name,
                values: {
                  create: option.values
                }
              }))
            }
          }
        })
        
        console.log(`✅ ย้ายสำเร็จ: ${mongoProduct.name} (ID: ${createdProduct.id})`)
        
      } catch (error) {
        console.error(`❌ ผิดพลาดในการย้าย ${mongoProduct.name}:`, error.message)
      }
    }
    
    console.log('🎉 การย้ายข้อมูลเสร็จสิ้น!')
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error)
  } finally {
    await mongoClient.close()
    await prisma.$disconnect()
  }
}

async function migrateCategories() {
  const mongoClient = new MongoClient(MONGODB_URI)
  
  try {
    console.log('กำลังย้าย Categories...')
    await mongoClient.connect()
    const mongoDb = mongoClient.db()
    
    // ดึง categories ที่ไม่ซ้ำจาก products
    const categories = await mongoDb.collection('products').distinct('category')
    const validCategories = categories.filter(cat => cat && cat.trim() !== '')
    
    for (const categoryName of validCategories) {
      try {
        await prisma.category.create({
          data: {
            name: categoryName,
            description: `หมวดหมู่ ${categoryName}`
          }
        })
        console.log(`✅ สร้างหมวดหมู่: ${categoryName}`)
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ หมวดหมู่ ${categoryName} มีอยู่แล้ว`)
        } else {
          console.error(`❌ ผิดพลาดในการสร้างหมวดหมู่ ${categoryName}:`, error.message)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการย้าย categories:', error)
  } finally {
    await mongoClient.close()
  }
}

// รันการย้ายข้อมูล
async function main() {
  console.log('🚀 เริ่มการย้ายข้อมูลจาก MongoDB ไป MySQL')
  
  try {
    // ย้าย categories ก่อน
    await migrateCategories()
    
    // จากนั้นย้าย products
    await migrateProducts()
    
    console.log('🎊 การย้ายข้อมูลทั้งหมดเสร็จสิ้น!')
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดร้ายแรง:', error)
    process.exit(1)
  }
}

// ตรวจสอบว่ารันโดยตรงหรือไม่
if (require.main === module) {
  main()
}

module.exports = { migrateProducts, migrateCategories }
