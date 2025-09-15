# การย้ายฐานข้อมูลจาก MongoDB ไป MySQL

## ขั้นตอนการตั้งค่า

### 1. ติดตั้งและเตรียม MySQL
```bash
# ติดตั้ง MySQL Server บนเครื่อง
# หรือใช้ XAMPP, WAMP, หรือ Docker

# สร้างฐานข้อมูลใหม่
CREATE DATABASE signshop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. แก้ไขไฟล์ .env
```bash
# แก้ไข DATABASE_URL ใน .env ให้ตรงกับการตั้งค่า MySQL ของคุณ
DATABASE_URL="mysql://username:password@localhost:3306/signshop_db"
```

### 3. สร้างตารางในฐานข้อมูล
```bash
# Generate Prisma Client
npm run db:generate

# Push schema ไปยัง MySQL (สำหรับ development)
npm run db:push

# หรือใช้ migrate (สำหรับ production)
npm run db:migrate
```

### 4. ย้ายข้อมูลจาก MongoDB
```bash
# ตั้งค่า MONGODB_URI ใน .env ก่อน
MONGODB_URI="mongodb://localhost:27017/your-old-db"

# รันสคริปต์ย้ายข้อมูล
npm run migrate:mongo-to-mysql
```

### 5. ตรวจสอบข้อมูล
```bash
# เปิด Prisma Studio เพื่อดูข้อมูล
npm run db:studio
```

## การใช้งาน API ใหม่

### API Endpoints สำหรับ MySQL:
- `GET /api/products-mysql` - ดึงสินค้าทั้งหมด
- `POST /api/products-mysql` - เพิ่มสินค้าใหม่
- `GET /api/products-mysql/[id]` - ดึงสินค้าตาม ID
- `PUT /api/products-mysql/[id]` - แก้ไขสินค้า
- `DELETE /api/products-mysql/[id]` - ลบสินค้า

### ตัวอย่างการใช้งาน:
```javascript
// เพิ่มสินค้าพร้อมตัวเลือก
const response = await fetch('/api/products-mysql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'เสื้อยืด',
    price: 299,
    category: 'เสื้อผ้า',
    description: 'เสื้อยืดคุณภาพดี',
    images: ['image1.jpg'],
    options: [
      {
        name: 'ไซส์',
        values: [
          { value: 'S', price: 0, priceType: 'add', stock: 10 },
          { value: 'M', price: 20, priceType: 'add', stock: 15 },
          { value: 'L', price: 40, priceType: 'add', stock: 8 }
        ]
      },
      {
        name: 'สี',
        values: [
          { value: 'ขาว', price: 0, priceType: 'add', stock: 20 },
          { value: 'ดำ', price: 0, priceType: 'add', stock: 15 }
        ]
      }
    ]
  })
})
```

## ข้อดีของการใช้ MySQL + Prisma

1. **Type Safety**: Prisma ให้ type-safe database access
2. **Performance**: MySQL มีประสิทธิภาพดีสำหรับ relational data
3. **ACID Compliance**: รองรับ transactions ที่แน่นอน
4. **Better Relations**: จัดการ relationships ระหว่างตารางได้ดีกว่า
5. **Migration Support**: Prisma มี migration system ที่ดี
6. **IntelliSense**: Auto-completion ใน IDE
7. **Query Optimization**: Prisma สร้าง optimized queries

## การ Backup ข้อมูล

```bash
# Backup MySQL
mysqldump -u username -p signshop_db > backup.sql

# Restore MySQL
mysql -u username -p signshop_db < backup.sql
```

## Troubleshooting

### หากมีปัญหากับ Prisma Client:
```bash
npm run db:generate
```

### หากมีปัญหากับ Schema:
```bash
npx prisma db push --force-reset
```

### หากต้องการดู Raw SQL:
```bash
npx prisma studio
```
