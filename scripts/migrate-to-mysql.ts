import { MongoClient } from 'mongodb';
import prisma from '../src/lib/prisma';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.DB_NAME || 'signshop';

async function main() {
  console.log('🚀 เริ่มต้นการย้ายข้อมูลจาก MongoDB ไป MySQL...');
  
  // เชื่อมต่อ MongoDB
  const mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  const db = mongoClient.db(DB_NAME);
  
  console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');

  try {
    // 1. ย้าย Categories
    await migrateCategories(db);
    
    // 2. ย้าย Sellers
    await migrateSellers(db);
    
    // 3. ย้าย Products
    await migrateProducts(db);
    
    // 4. ย้าย Orders
    await migrateOrders(db);
    
    console.log('🎉 ย้ายข้อมูลทั้งหมดเสร็จสิ้น!');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดขณะย้ายข้อมูล:', error);
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
  }
}

async function migrateCategories(db: any) {
  console.log('📂 ย้าย Categories...');
  
  const categories = await db.collection('categories').find().toArray();
  
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {
        description: cat.description || null,
      },
      create: {
        name: cat.name,
        description: cat.description || null,
        createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
      }
    });
  }
  
  console.log(`✅ ย้าย Categories จำนวน ${categories.length} รายการ`);
}

async function migrateSellers(db: any) {
  console.log('👤 ย้าย Sellers...');
  
  const sellers = await db.collection('sellers').find().toArray();
  
  for (const seller of sellers) {
    await prisma.seller.upsert({
      where: { username: seller.username },
      update: {
        shopName: seller.shopName || null,
        fullName: seller.fullName || seller.name || null,
        email: seller.email || null,
        phone: seller.phone || null,
        image: seller.image || null,
        address: seller.address || null,
      },
      create: {
        username: seller.username,
        shopName: seller.shopName || null,
        fullName: seller.fullName || seller.name || null,
        email: seller.email || null,
        phone: seller.phone || null,
        image: seller.image || null,
        address: seller.address || null,
        createdAt: seller.createdAt ? new Date(seller.createdAt) : new Date(),
      }
    });
  }
  
  console.log(`✅ ย้าย Sellers จำนวน ${sellers.length} รายการ`);
}

async function migrateProducts(db: any) {
  console.log('📦 ย้าย Products...');
  
  const products = await db.collection('seller_products').find().toArray();
  
  for (const product of products) {
    // สร้าง Product record
    const createdProduct = await prisma.product.create({
      data: {
        name: product.name || 'Untitled Product',
        price: parseFloat(product.price) || 0,
        category: product.category || null,
        description: product.description || product.desc || null,
        image: product.image || null,
        images: product.images ? product.images : null,
        rating: parseFloat(product.rating) || 0,
        reviews: parseInt(product.reviews) || 0,
        sold: parseInt(product.sold) || 0,
        stock: parseInt(product.stock) || 999,
        createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
      }
    });

    // ย้าย Product Options ถ้ามี
    if (product.options && Array.isArray(product.options)) {
      for (const option of product.options) {
        const createdOption = await prisma.productOption.create({
          data: {
            name: option.name || 'Option',
            productId: createdProduct.id,
          }
        });

        // ย้าย Option Values
        if (option.values && Array.isArray(option.values)) {
          for (const value of option.values) {
            await prisma.productOptionValue.create({
              data: {
                value: value.value || value,
                price: parseFloat(value.price) || 0,
                priceType: value.priceType || 'add',
                stock: parseInt(value.stock) || 0,
                sku: value.sku || null,
                optionId: createdOption.id,
              }
            });
          }
        }
      }
    }
  }
  
  console.log(`✅ ย้าย Products จำนวน ${products.length} รายการ`);
}

async function migrateOrders(db: any) {
  console.log('🛒 ย้าย Orders...');
  
  const orders = await db.collection('orders').find().toArray();
  
  for (const order of orders) {
    await prisma.order.create({
      data: {
        orderNumber: order.orderNumber || order._id?.toString() || `ORD-${Date.now()}`,
        totalAmount: parseFloat(order.total) || parseFloat(order.totalAmount) || 0,
        status: order.status || 'pending',
        customerInfo: order.customerInfo || {
          name: order.customerName || 'Unknown',
          phone: order.customerPhone || '',
          address: order.customerAddress || ''
        },
        shippingInfo: order.shippingInfo || null,
        items: order.items || order.cart || [],
        createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
      }
    });
  }
  
  console.log(`✅ ย้าย Orders จำนวน ${orders.length} รายการ`);
}

// รันเฉพาะเมื่อไฟล์ถูกเรียกโดยตรง
if (require.main === module) {
  main().catch(console.error);
}

export { main as migrateData };
