/**
 * สคริปต์ทดสอบการเชื่อมต่อฐานข้อมูล MySQL
 * รันด้วย: node scripts/test-db-connection.js
 */

const mysql = require('mysql2/promise')

async function testConnection() {
  console.log('🔍 ทดสอบการเชื่อมต่อฐานข้อมูล...')

  const configs = [
    {
      name: 'ข้อมูลปัจจุบัน',
      config: {
        host: 'th-thai.shop',
        port: 3306,
        user: 'thth_thaish_Data',
        password: '1314Ninja',
        database: 'thth_thaish_Data',
        connectTimeout: 60000,
        acquireTimeout: 60000,
      }
    },
    {
      name: 'ลองใช้ root user',
      config: {
        host: 'th-thai.shop',
        port: 3306,
        user: 'root',
        password: '1314Ninja',
        database: 'thth_thaish_Data',
        connectTimeout: 60000,
        acquireTimeout: 60000,
      }
    },
    {
      name: 'ลองไม่ระบุ database',
      config: {
        host: 'th-thai.shop',
        port: 3306,
        user: 'thth_thaish_Data',
        password: '1314Ninja',
        connectTimeout: 60000,
        acquireTimeout: 60000,
      }
    }
  ]

  for (const { name, config } of configs) {
    try {
      console.log(`\n📡 ${name}:`)
      console.log(`   Host: ${config.host}:${config.port}`)
      console.log(`   User: ${config.user}`)
      console.log(`   Database: ${config.database || 'ไม่ระบุ'}`)
      
      const connection = await mysql.createConnection(config)
      
      // ทดสอบ query พื้นฐาน
      const [rows] = await connection.execute('SELECT 1 as test, VERSION() as version')
      console.log(`   ✅ เชื่อมต่อสำเร็จ! MySQL Version: ${rows[0].version}`)
      
      // แสดงฐานข้อมูลที่มี
      const [databases] = await connection.execute('SHOW DATABASES')
      console.log(`   📁 ฐานข้อมูลที่พบ:`)
      databases.forEach(db => {
        console.log(`      - ${Object.values(db)[0]}`)
      })
      
      await connection.end()
      console.log(`   🎉 การทดสอบ ${name} สำเร็จ!`)
      break // ถ้าสำเร็จแล้วให้หยุด
      
    } catch (error) {
      console.log(`   ❌ ล้มเหลว: ${error.message}`)
      
      if (error.code === 'ENOTFOUND') {
        console.log(`   💡 เคล็ดลับ: ตรวจสอบชื่อโดเมน th-thai.shop`)
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log(`   💡 เคล็ดลับ: ตรวจสอบ username/password`)
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   💡 เคล็ดลับ: ตรวจสอบว่า MySQL เปิดอยู่และ port 3306 accessible`)
      }
    }
  }
}

// ทดสอบการเชื่อมต่อ ping
async function testPing() {
  const { spawn } = require('child_process')
  
  return new Promise((resolve, reject) => {
    console.log('\n🏓 ทดสอบ ping ไปยัง th-thai.shop...')
    
    const ping = spawn('ping', ['-n', '4', 'th-thai.shop'])
    
    ping.stdout.on('data', (data) => {
      console.log(data.toString())
    })
    
    ping.stderr.on('data', (data) => {
      console.error(data.toString())
    })
    
    ping.on('close', (code) => {
      if (code === 0) {
        console.log('✅ เซิร์ฟเวอร์ตอบสนอง')
        resolve(true)
      } else {
        console.log('❌ เซิร์ฟเวอร์ไม่ตอบสนอง')
        resolve(false)
      }
    })
  })
}

async function main() {
  console.log('🚀 เริ่มทดสอบการเชื่อมต่อฐานข้อมูล th-thai.shop')
  
  // ทดสอบ ping ก่อน
  await testPing()
  
  // ทดสอบการเชื่อมต่อฐานข้อมูล
  await testConnection()
  
  console.log('\n📋 ข้อเสนอแนะ:')
  console.log('1. ตรวจสอบว่า MySQL server เปิด remote access')
  console.log('2. ตรวจสอบ firewall settings ที่ port 3306')
  console.log('3. ตรวจสอบ user privileges สำหรับ remote connection')
  console.log('4. ลองใช้ phpMyAdmin หรือ MySQL Workbench ทดสอบก่อน')
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testConnection, testPing }
