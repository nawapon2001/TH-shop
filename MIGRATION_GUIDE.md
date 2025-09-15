# การย้ายฐานข้อมูลจาก MongoDB ไป MySQL

## ขั้นตอนการดำเนินการ

### 1. ตรวจสอบการเชื่อมต่อ MySQL
```bash
npm run test:mysql
```

### 2. แก้ไข DATABASE_URL ใน .env
อัพเดตค่าใน `.env` ให้ตรงกับการตั้งค่า SQLTools ของคุณ:
```
DATABASE_URL="mysql://username:password@host:port/database"
```

ตัวอย่าง:
```
DATABASE_URL="mysql://root:password@localhost:3306/signshop"
```

### 3. สร้าง Database Schema
```bash
npx prisma migrate dev --name initial_mysql_migration
```

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. ย้ายข้อมูลจาก MongoDB
```bash
npm run migrate:data
```

### 6. ตรวจสอบข้อมูลใน Database
```bash
npx prisma studio
```

## ไฟล์ที่ต้องปรับปรุงหลังการย้าย

### API Routes ที่ต้องแก้ไข:
- `src/app/api/seller-products/route.ts`
- `src/app/api/categories/route.ts`
- `src/app/api/announcements/route.ts`
- `src/app/api/orders/route.ts`

### ตัวอย่างการแก้ไข API Route:

#### เดิม (MongoDB):
```typescript
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  const client = await clientPromise
  const db = client.db('signshop')
  const products = await db.collection('products').find({}).toArray()
  return NextResponse.json(products)
}
```

#### ใหม่ (MySQL + Prisma):
```typescript
import prisma from '@/lib/prisma'

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      options: {
        include: {
          values: true
        }
      }
    }
  })
  return NextResponse.json(products)
}
```

## Schema Design

### MongoDB Collections → MySQL Tables:
- `seller_products` → `products` + `product_options` + `product_option_values`
- `categories` → `categories`
- `sellers` → `sellers`
- `orders` → `orders`

### ข้อมูลที่เปลี่ยนแปลง:
- MongoDB `_id` → MySQL `id` (Auto Increment)
- Nested arrays → Relational tables
- JSON fields → Structured relations

## Rollback Plan

หากต้องการย้อนกลับ:
1. เปลี่ยน API routes กลับไปใช้ MongoDB
2. อัพเดต environment variables
3. ข้อมูล MongoDB ยังคงอยู่ครบถ้วน

## Performance Considerations

### Indexes ที่แนะนำ:
```sql
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_sellers_username ON sellers(username);
```

### Prisma Query Optimization:
- ใช้ `select` สำหรับ fields ที่จำเป็น
- ใช้ `include` สำหรับ relations ที่ต้องการ
- ทำ pagination ด้วย `skip` และ `take`

## ตรวจสอบหลังการย้าย

1. ✅ Data integrity - ข้อมูลครบถ้วน
2. ✅ API functionality - endpoints ทำงานปกติ
3. ✅ Frontend display - หน้าเว็บแสดงผลถูกต้อง
4. ✅ Performance - response time ยอมรับได้
5. ✅ Error handling - จัดการ error ได้

## Support

หากมีปัญหา:
1. ตรวจสอบ MySQL server ทำงาน
2. ตรวจสอบ DATABASE_URL
3. ดู error logs ใน console
4. ตรวจสอบ Prisma schema syntax
