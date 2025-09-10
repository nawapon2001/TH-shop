// สคริปต์สำหรับอัปเดตสินค้าที่มีอยู่ให้รองรับราคาแยกตามตัวเลือก
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || '';
const DB_NAME = 'signshop';

async function migrateProductOptions() {
  if (!MONGO_URI) {
    console.log('กรุณาตั้งค่า MONGO_URI ในไฟล์ .env.local');
    return;
  }

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('เชื่อมต่อ MongoDB สำเร็จ');

    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');

    // ดึงสินค้าทั้งหมดที่มี options แบบเก่า (string[])
    const products = await productsCollection.find({
      options: { $exists: true, $ne: null }
    }).toArray();

    console.log(`พบสินค้าที่ต้องอัปเดต: ${products.length} รายการ`);

    let updatedCount = 0;

    for (const product of products) {
      if (!product.options || !Array.isArray(product.options)) continue;

      let needsUpdate = false;
      const newOptions = product.options.map(option => {
        if (!option || typeof option !== 'object') return option;

        // ตรวจสอบว่า values เป็น string[] หรือ object[] แล้ว
        if (Array.isArray(option.values)) {
          const newValues = option.values.map(value => {
            // ถ้าเป็น string ให้แปลงเป็น object
            if (typeof value === 'string') {
              needsUpdate = true;
              return {
                value: value,
                price: 0,
                priceType: 'add'
              };
            }
            // ถ้าเป็น object แล้วให้ตรวจสอบว่ามี property ครบไหม
            else if (typeof value === 'object' && value !== null) {
              if (!value.hasOwnProperty('price') || !value.hasOwnProperty('priceType')) {
                needsUpdate = true;
                return {
                  value: value.value || '',
                  price: value.price || 0,
                  priceType: value.priceType || 'add'
                };
              }
              return value;
            }
            return value;
          });

          return {
            ...option,
            values: newValues
          };
        }

        return option;
      });

      if (needsUpdate) {
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { options: newOptions } }
        );
        updatedCount++;
        console.log(`อัปเดตสินค้า: ${product.name || 'ไม่มีชื่อ'}`);
      }
    }

    console.log(`\nอัปเดตเสร็จสิ้น: ${updatedCount} รายการ`);

    // แสดงตัวอย่างสินค้าหลังอัปเดต
    const sampleProduct = await productsCollection.findOne({
      options: { $exists: true, $ne: null, $not: { $size: 0 } }
    });

    if (sampleProduct) {
      console.log('\nตัวอย่างโครงสร้างใหม่:');
      console.log(JSON.stringify(sampleProduct.options, null, 2));
    }

  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  } finally {
    await client.close();
    console.log('ปิดการเชื่อมต่อ MongoDB');
  }
}

// รัน script
migrateProductOptions();
