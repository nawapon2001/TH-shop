// สคริปต์สำหรับเพิ่มหมวดหมู่เริ่มต้น
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || '';
const DB_NAME = 'signshop';

const defaultCategories = [
  'มือถือ & แท็บเล็ต',
  'คอมพิวเตอร์ & เกมมิ่ง',
  'แฟชั่นผู้หญิง',
  'แฟชั่นผู้ชาย',
  'ความงาม & สุขภาพ',
  'บ้าน & ไลฟ์สไตล์',
  'ซูเปอร์มาร์เก็ต',
  'อิเล็กทรอนิกส์',
  'กีฬา & กลางแจ้ง',
  'หนังสือ & เครื่องเขียน',
  'ของเล่น & เกม',
  'รถยนต์ & มอเตอร์ไซค์'
];

async function initCategories() {
  if (!MONGO_URI) {
    console.log('กรุณาตั้งค่า MONGO_URI ในไฟล์ .env.local');
    return;
  }

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('เชื่อมต่อ MongoDB สำเร็จ');

    const db = client.db(DB_NAME);
    const categoriesCollection = db.collection('categories');

    // ตรวจสอบว่ามีหมวดหมู่อยู่แล้วหรือไม่
    const existingCategories = await categoriesCollection.find({}).toArray();
    console.log(`มีหมวดหมู่อยู่แล้ว ${existingCategories.length} หมวดหมู่:`);
    existingCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name}`);
    });

    // หาหมวดหมู่ที่ยังไม่มี
    const existingNames = existingCategories.map(cat => cat.name);
    const missingCategories = defaultCategories.filter(name => !existingNames.includes(name));
    
    if (missingCategories.length === 0) {
      console.log('มีหมวดหมู่ครบทุกหมวดหมู่แล้ว');
      return;
    }

    console.log(`\nกำลังเพิ่มหมวดหมู่ที่ขาดหายไป ${missingCategories.length} หมวดหมู่:`);
    missingCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat}`);
    });

    // เพิ่มหมวดหมู่ที่ขาดหายไป
    const categoryDocs = missingCategories.map(name => ({
      name,
      icon: null,
      createdAt: new Date()
    }));

    const result = await categoriesCollection.insertMany(categoryDocs);
    console.log(`\nเพิ่มหมวดหมู่สำเร็จ: ${result.insertedCount} หมวดหมู่`);

  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  } finally {
    await client.close();
    console.log('ปิดการเชื่อมต่อ MongoDB');
  }
}

// รัน script
initCategories();
