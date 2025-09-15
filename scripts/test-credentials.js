/**
 * สคริปต์ทดสอบ username/password ต่าง ๆ ที่เป็นไปได้
 */

const mysql = require('mysql2/promise')

async function testCredentials() {
  console.log('🔐 ทดสอบ credentials ต่าง ๆ...')

  const credentialsList = [
    // ข้อมูลปัจจุบัน (รหัสผ่านใหม่)
    { user: 'thth_thaish_Data', password: 'BAwfp7UXbXWAYC8uRakV', desc: 'ข้อมูลใหม่' },
    
    // ข้อมูลเดิม
    { user: 'thth_thaish_Data', password: '1314Ninja', desc: 'ข้อมูลเดิม' },
    
    // ลองชื่อฐานข้อมูลเป็น username
    { user: 'thth_thaish_Data', password: 'thth_thaish_Data', desc: 'password เป็นชื่อ database' },
    
    // ลองรูปแบบอื่น
    { user: 'ththaish_Data', password: '1314Ninja', desc: 'username ไม่มี underscore' },
    { user: 'thth_thai_Data', password: '1314Ninja', desc: 'username มี thai' },
    
    // ลอง root
    { user: 'root', password: 'BAwfp7UXbXWAYC8uRakV', desc: 'root user ใหม่' },
    { user: 'root', password: '1314Ninja', desc: 'root user เดิม' },
    { user: 'root', password: 'root', desc: 'root/root' },
    { user: 'root', password: '', desc: 'root ไม่มี password' },
    
    // รูปแบบ cPanel
    { user: 'thth_thth_thaish_Data', password: 'BAwfp7UXbXWAYC8uRakV', desc: 'cPanel format ใหม่' },
    { user: 'ththaish_thth_thaish_Data', password: 'BAwfp7UXbXWAYC8uRakV', desc: 'cPanel format 2 ใหม่' },
  ]

  for (const cred of credentialsList) {
    try {
      console.log(`\n🔑 ทดสอบ: ${cred.desc}`)
      console.log(`   User: ${cred.user}`)
      console.log(`   Password: ${cred.password || '(ไม่มี)'}`)
      
      const connection = await mysql.createConnection({
        host: 'th-thai.shop',
        port: 3306,
        user: cred.user,
        password: cred.password,
        connectTimeout: 30000,
      })
      
      const [rows] = await connection.execute('SELECT 1 as test, VERSION() as version, USER() as current_user')
      console.log(`   ✅ เชื่อมต่อสำเร็จ!`)
      console.log(`   📋 MySQL Version: ${rows[0].version}`)
      console.log(`   👤 Current User: ${rows[0].current_user}`)
      
      // ทดสอบดู databases ที่เข้าถึงได้
      try {
        const [databases] = await connection.execute('SHOW DATABASES')
        console.log(`   📁 ฐานข้อมูลที่เข้าถึงได้:`)
        databases.forEach(db => {
          const dbName = Object.values(db)[0]
          console.log(`      - ${dbName}`)
        })
      } catch (dbError) {
        console.log(`   ⚠️ ไม่สามารถดู databases: ${dbError.message}`)
      }
      
      // ทดสอบเข้าถึงฐานข้อมูล thth_thaish_Data
      try {
        await connection.execute('USE thth_thaish_Data')
        const [tables] = await connection.execute('SHOW TABLES')
        console.log(`   📋 ตารางในฐานข้อมูล thth_thaish_Data:`)
        tables.forEach(table => {
          const tableName = Object.values(table)[0]
          console.log(`      - ${tableName}`)
        })
      } catch (useError) {
        console.log(`   ⚠️ ไม่สามารถเข้าถึงฐานข้อมูล thth_thaish_Data: ${useError.message}`)
      }
      
      await connection.end()
      
      // ถ้าเจอ credentials ที่ถูกต้อง ให้อัปเดต .env
      console.log(`\n🎉 พบ credentials ที่ถูกต้อง!`)
      console.log(`📝 แนะนำให้อัปเดต .env เป็น:`)
      console.log(`DATABASE_URL="mysql://${cred.user}:${cred.password}@th-thai.shop:3306/thth_thaish_Data"`)
      
      return cred // ส่งกลับ credentials ที่ถูกต้อง
      
    } catch (error) {
      console.log(`   ❌ ล้มเหลว: ${error.message}`)
    }
  }
  
  console.log('\n💡 ไม่พบ credentials ที่ถูกต้อง')
  console.log('🔧 แนะนำ:')
  console.log('1. ตรวจสอบใน cPanel → MySQL Databases')
  console.log('2. ดูรายชื่อ Users ที่มีอยู่')
  console.log('3. ตรวจสอบ Remote MySQL Access Hosts')
  console.log('4. ลองเข้าผ่าน phpMyAdmin ก่อน')
  
  return null
}

if (require.main === module) {
  testCredentials().catch(console.error)
}

module.exports = { testCredentials }
