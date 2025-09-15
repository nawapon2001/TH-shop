/**
 * ทดสอบ API หลังจากสร้างตารางแล้ว
 * รันด้วย: node scripts/test-api.js
 */

async function testAPI() {
  console.log('🚀 ทดสอบ API หลังจากสร้างฐานข้อมูล...')

  try {
    // ทดสอบดึงข้อมูลสินค้า
    console.log('\n📦 ทดสอบ GET /api/products-mysql')
    const getResponse = await fetch('http://localhost:3000/api/products-mysql')
    console.log(`Status: ${getResponse.status}`)
    
    if (getResponse.ok) {
      const products = await getResponse.json()
      console.log(`✅ ดึงสินค้าได้ ${products.length} รายการ`)
    } else {
      const error = await getResponse.text()
      console.log(`❌ Error: ${error}`)
    }

    // ทดสอบเพิ่มสินค้า
    console.log('\n➕ ทดสอบ POST /api/products-mysql')
    const postResponse = await fetch('http://localhost:3000/api/products-mysql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'สินค้าทดสอบ',
        price: 199,
        category: 'ทดสอบ',
        description: 'สินค้าสำหรับทดสอบระบบ',
        images: ['test.jpg'],
        options: [
          {
            name: 'ขนาด',
            values: [
              { value: 'S', price: 0, priceType: 'add', stock: 10 },
              { value: 'M', price: 20, priceType: 'add', stock: 15 }
            ]
          }
        ]
      })
    })

    console.log(`Status: ${postResponse.status}`)
    
    if (postResponse.ok) {
      const result = await postResponse.json()
      console.log(`✅ เพิ่มสินค้าสำเร็จ ID: ${result.id}`)
    } else {
      const error = await postResponse.text()
      console.log(`❌ Error: ${error}`)
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message)
    console.log('💡 ตรวจสอบว่า Next.js dev server รันอยู่ที่ port 3000')
  }
}

if (require.main === module) {
  testAPI()
}

module.exports = { testAPI }
