/**
 * ตัวอย่างการใช้งาน Prisma สำหรับจัดการสินค้า
 * สามารถรันไฟล์นี้เพื่อทดสอบการทำงาน: node examples/prisma-usage.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSampleProduct() {
  try {
    const product = await prisma.product.create({
      data: {
        name: 'เสื้อยืดตัวอย่าง',
        price: 299,
        category: 'เสื้อผ้า',
        description: 'เสื้อยืดคุณภาพดี ผ้านิ่ม ใส่สบาย',
        image: 'https://example.com/shirt.jpg',
        images: [
          'https://example.com/shirt-1.jpg',
          'https://example.com/shirt-2.jpg'
        ],
        stock: 100,
        options: {
          create: [
            {
              name: 'ไซส์',
              values: {
                create: [
                  {
                    value: 'S',
                    price: 0,
                    priceType: 'add',
                    stock: 20,
                    sku: 'SHIRT-S'
                  },
                  {
                    value: 'M',
                    price: 20,
                    priceType: 'add',
                    stock: 30,
                    sku: 'SHIRT-M'
                  },
                  {
                    value: 'L',
                    price: 40,
                    priceType: 'add',
                    stock: 25,
                    sku: 'SHIRT-L'
                  },
                  {
                    value: 'XL',
                    price: 60,
                    priceType: 'add',
                    stock: 15,
                    sku: 'SHIRT-XL'
                  }
                ]
              }
            },
            {
              name: 'สี',
              values: {
                create: [
                  {
                    value: 'ขาว',
                    price: 0,
                    priceType: 'add',
                    stock: 50,
                    sku: 'SHIRT-WHITE'
                  },
                  {
                    value: 'ดำ',
                    price: 0,
                    priceType: 'add',
                    stock: 40,
                    sku: 'SHIRT-BLACK'
                  },
                  {
                    value: 'แดง',
                    price: 10,
                    priceType: 'add',
                    stock: 30,
                    sku: 'SHIRT-RED'
                  }
                ]
              }
            }
          ]
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

    console.log('✅ สร้างสินค้าตัวอย่างสำเร็จ:', product)
    return product
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error)
  }
}

async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        options: {
          include: {
            values: true
          }
        }
      }
    })

    console.log('📦 สินค้าทั้งหมด:', products.length, 'รายการ')
    return products
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error)
  }
}

async function getProductById(id) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            values: true
          }
        }
      }
    })

    if (product) {
      console.log('🔍 พบสินค้า:', product.name)
    } else {
      console.log('❌ ไม่พบสินค้า ID:', id)
    }
    
    return product
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error)
  }
}

async function updateProductStock(id, newStock) {
  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock: newStock }
    })

    console.log('📝 อัปเดตสต็อกสำเร็จ:', updatedProduct.name, 'สต็อกใหม่:', newStock)
    return updatedProduct
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error)
  }
}

async function deleteProduct(id) {
  try {
    await prisma.product.delete({
      where: { id }
    })

    console.log('🗑️ ลบสินค้าสำเร็จ ID:', id)
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error)
  }
}

// ตัวอย่างการใช้งาน
async function main() {
  console.log('🚀 เริ่มทดสอบ Prisma...')

  // สร้างสินค้าตัวอย่าง
  const newProduct = await createSampleProduct()
  
  if (newProduct) {
    // ดูข้อมูลสินค้าที่สร้าง
    await getProductById(newProduct.id)
    
    // อัปเดตสต็อก
    await updateProductStock(newProduct.id, 150)
    
    // ดูสินค้าทั้งหมด
    await getAllProducts()
  }

  console.log('✅ การทดสอบเสร็จสิ้น')
}

// รันถ้าไฟล์นี้ถูกเรียกโดยตรง
if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

module.exports = {
  createSampleProduct,
  getAllProducts,
  getProductById,
  updateProductStock,
  deleteProduct
}
