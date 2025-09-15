#!/bin/bash

# Test Orders API with auto-generated orderNumber
echo "🛒 Testing Orders API..."
echo "========================"

# Test 1: Create order without orderNumber (should auto-generate)
echo "1. Testing POST order without orderNumber:"
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "totalAmount": 1500,
    "customerInfo": {
      "name": "ทดสอบ ลูกค้า",
      "phone": "0812345678", 
      "email": "test@example.com",
      "address": "123 ถนนทดสอบ"
    },
    "items": [
      {
        "productId": 1,
        "name": "เสื้อยืดคอกลม",
        "price": 299,
        "quantity": 2,
        "seller": "testshop"
      },
      {
        "productId": 2,
        "name": "หูฟังบลูทูธ",
        "price": 1590,
        "quantity": 1,
        "seller": "electronicshop"
      }
    ]
  }' \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n\n"

echo "2. Testing GET orders:"
curl -X GET http://localhost:3001/api/orders \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n\n"

echo "3. Testing POST announcements:"
curl -X POST http://localhost:3001/api/announcements \
  -H "Content-Type: application/json" \
  -d '{
    "title": "ประกาศทดสอบ",
    "content": "เนื้อหาประกาศทดสอบ",
    "type": "info"
  }' \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n\n"
  
echo "4. Testing GET announcements:"
curl -X GET http://localhost:3001/api/announcements \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n\n"

echo "✅ API Tests Complete!"
