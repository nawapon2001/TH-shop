// สคริปต์สำหรับทดสอบการเชื่อมต่อ MySQL
// รันด้วย: npm run test-mysql

import mysql from 'mysql2/promise';

async function testConnection() {
  try {
    // อัพเดต connection string ตามการตั้งค่าใน SQLTools ของคุณ
    const connection = await mysql.createConnection({
      host: 'th-thai.shop',
      port: 3306,
      user: 'ththaish_Data',
      password: 'Ninja1314',
      database: 'ththaish_Data'
    });

    console.log('✅ เชื่อมต่อ MySQL สำเร็จ!');
    
    // ทดสอบ query ง่ายๆ แทนการสร้างฐานข้อมูล
    const [rows] = await connection.execute('SELECT DATABASE() as current_db');
    console.log('✅ ฐานข้อมูลปัจจุบัน:', (rows as any)[0].current_db);
    
    // ตรวจสอบ tables ที่มีอยู่
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tables ที่มีอยู่:', tables);
    
    await connection.end();
    console.log('✅ พร้อมสำหรับ Prisma migration!');
  } catch (error) {
    console.error('❌ ไม่สามารถเชื่อมต่อ MySQL:', error);
    console.log('\n💡 กรุณาตรวจสอบ:');
    console.log('1. MySQL server กำลังทำงานอยู่');
    console.log('2. username และ password ถูกต้อง');
    console.log('3. พอร์ต 3306 เปิดใช้งาน');
    console.log('4. อัพเดต DATABASE_URL ใน .env ให้ตรงกับ SQLTools config');
  }
}

testConnection();
