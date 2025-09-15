// ทดสอบ API routes ที่อัปเดตเป็น Prisma แล้ว
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function testApiRoutes() {
  try {
    console.log('🧪 ทดสอบ API Routes กับ Prisma...\n');

    // ทดสอบ GET /api/products
    console.log('1. ทดสอบ GET /api/products');
    try {
      const response = await fetch('http://localhost:3000/api/products');
      const products = await response.json();
      console.log(`✅ GET /api/products: ${products.length} สินค้า`);
      if (products.length > 0) {
        console.log(`   ตัวอย่าง: ${products[0].name} (฿${products[0].price})`);
      }
    } catch (err) {
      console.log('❌ GET /api/products failed:', err);
    }

    // ทดสอบ GET /api/sellers
    console.log('\n2. ทดสอบ GET /api/sellers');
    try {
      const response = await fetch('http://localhost:3000/api/sellers');
      const sellers = await response.json();
      console.log(`✅ GET /api/sellers: ${sellers.length} ผู้ขาย`);
      if (sellers.length > 0) {
        console.log(`   ตัวอย่าง: ${sellers[0].username}`);
      }
    } catch (err) {
      console.log('❌ GET /api/sellers failed:', err);
    }

    // ทดสอบ GET /api/orders
    console.log('\n3. ทดสอบ GET /api/orders');
    try {
      const response = await fetch('http://localhost:3000/api/orders');
      const orders = await response.json();
      console.log(`✅ GET /api/orders: ${orders.length} คำสั่งซื้อ`);
      if (orders.length > 0) {
        console.log(`   ตัวอย่าง: ${orders[0].orderNumber} (฿${orders[0].totalAmount})`);
      }
    } catch (err) {
      console.log('❌ GET /api/orders failed:', err);
    }

    // ทดสอบ GET single product
    console.log('\n4. ทดสอบ GET /api/products/[id]');
    try {
      const firstProduct = await prisma.product.findFirst();
      if (firstProduct) {
        const response = await fetch(`http://localhost:3000/api/products/${firstProduct.id}`);
        const product = await response.json();
        console.log(`✅ GET /api/products/${firstProduct.id}: ${product.name}`);
        console.log(`   Options: ${product.options?.length || 0} ชุด`);
      } else {
        console.log('⚠️  ไม่มีสินค้าในฐานข้อมูลสำหรับทดสอบ');
      }
    } catch (err) {
      console.log('❌ GET /api/products/[id] failed:', err);
    }

    // ทดสอบ POST สินค้าใหม่
    console.log('\n5. ทดสอบ POST /api/products (สร้างสินค้าทดสอบ)');
    try {
      const testProduct = {
        name: 'สินค้าทดสอบ API ' + Date.now(),
        price: 599,
        category: 'ทดสอบ',
        description: 'สินค้าสำหรับทดสอบ API ที่อัปเดตเป็น Prisma',
        images: [],
        options: [
          {
            name: 'ขนาด',
            values: [
              { value: 'S', price: 0, priceType: 'add', stock: 10 },
              { value: 'M', price: 50, priceType: 'add', stock: 15 },
              { value: 'L', price: 100, priceType: 'add', stock: 8 }
            ]
          }
        ]
      };

      const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testProduct)
      });

      const result = await response.json();
      if (response.ok) {
        console.log(`✅ POST /api/products: สร้างสินค้า ID ${result.id}`);
        console.log(`   ${result.product.name} - ${result.product.options.length} options`);
      } else {
        console.log('❌ POST /api/products failed:', result.message);
      }
    } catch (err) {
      console.log('❌ POST /api/products failed:', err);
    }

    console.log('\n✅ การทดสอบ API Routes เสร็จสิ้น!');
    console.log('\n📊 สรุปสถานะ:');
    
    const stats = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.seller.count(),
      prisma.order.count()
    ]);

    console.log(`   • Products: ${stats[0]} รายการ`);
    console.log(`   • Categories: ${stats[1]} รายการ`);
    console.log(`   • Sellers: ${stats[2]} รายการ`);
    console.log(`   • Orders: ${stats[3]} รายการ`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiRoutes();
