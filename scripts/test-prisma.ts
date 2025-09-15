// ทดสอบ Prisma Client กับ MySQL
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function testPrisma() {
  try {
    console.log('🔍 ทดสอบ Prisma Client...');
    
    // ทดสอบอ่านข้อมูล
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    const sellerCount = await prisma.seller.count();
    const orderCount = await prisma.order.count();
    
    console.log('📊 สถิติฐานข้อมูล:');
    console.log(`  - Products: ${productCount} รายการ`);
    console.log(`  - Categories: ${categoryCount} รายการ`);
    console.log(`  - Sellers: ${sellerCount} รายการ`);
    console.log(`  - Orders: ${orderCount} รายการ`);
    
    // ทดสอบ query products พร้อม options
    const products = await prisma.product.findMany({
      take: 3,
      include: {
        options: {
          include: {
            values: true
          }
        }
      }
    });
    
    console.log('\n📦 ตัวอย่าง Products:');
    products.forEach(product => {
      console.log(`  - ${product.name} (฿${product.price})`);
      if (product.options.length > 0) {
        console.log(`    Options: ${product.options.length} ชุด`);
      }
    });
    
    console.log('\n✅ Prisma Client ทำงานได้ปกติ!');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
