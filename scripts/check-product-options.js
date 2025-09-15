const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function checkProductOptions() {
  try {
    await client.connect();
    console.log('เชื่อมต่อ MongoDB สำเร็จ');
    
    const db = client.db('signshop');
    const collection = db.collection('products');
    
    // หาสินค้าที่มี options
    const products = await collection.find({ 
      options: { $exists: true, $ne: null, $not: { $size: 0 } } 
    }).toArray();
    
    console.log(`\nพบสินค้าที่มี options: ${products.length} รายการ\n`);
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. สินค้า: ${product.name || 'ไม่มีชื่อ'}`);
      console.log(`   ID: ${product._id}`);
      
      if (Array.isArray(product.options)) {
        product.options.forEach((option, optIndex) => {
          console.log(`   ตัวเลือก ${optIndex + 1}: ${option.name || 'ไม่มีชื่อ'}`);
          
          if (Array.isArray(option.values)) {
            option.values.forEach((value, valIndex) => {
              if (typeof value === 'string') {
                console.log(`     - ${value} (string)`);
              } else if (typeof value === 'object' && value !== null) {
                console.log(`     - ${JSON.stringify(value)} (object)`);
              } else {
                console.log(`     - ${value} (${typeof value})`);
              }
            });
          } else {
            console.log(`     values ไม่ใช่ array: ${typeof option.values}`);
          }
        });
      } else {
        console.log(`   options ไม่ใช่ array: ${typeof product.options}`);
      }
      console.log('---');
    });
    
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  } finally {
    await client.close();
  }
}

checkProductOptions();
