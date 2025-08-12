# MongoDB Atlas Setup Guide

## 1. สร้าง MongoDB Atlas Account และ Cluster

### ขั้นตอนการสร้าง:
1. ไปที่ [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. สมัครสมาชิกหรือเข้าสู่ระบบ
3. คลิก "Build a Database" เลือก "Shared" (ฟรี tier)
4. เลือก Provider และ Region ที่ใกล้ที่สุด (เช่น AWS Singapore)
5. ตั้งชื่อ Cluster (เช่น `signshop-cluster`)
6. คลิก "Create Cluster"

## 2. ตั้งค่า Network Access

1. ไปที่ "Network Access" ใน sidebar
2. คลิก "Add IP Address"
3. เลือก "Allow Access from Anywhere" (0.0.0.0/0) สำหรับ development
   - สำหรับ production ควรระบุ IP ที่เจาะจง

## 3. สร้าง Database User

1. ไปที่ "Database Access" ใน sidebar
2. คลิก "Add New Database User"
3. ตั้ง Username และ Password
4. เลือก "Read and Write to any database" สำหรับสิทธิ์
5. คลิก "Add User"

## 4. รับ Connection String

1. ไปที่ "Database" → "Connect" → "Connect your application"
2. เลือก "Node.js" และเวอร์ชันล่าสุด
3. คัดลอก connection string ที่ได้รับ:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database-name>?retryWrites=true&w=majority
   ```

## 5. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ใน root directory:

```env
# MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/signshop?retryWrites=true&w=majority

# ตัวอย่าง:
# MONGO_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/signshop?retryWrites=true&w=majority
```

## 6. ทดสอบการเชื่อมต่อ

สร้างไฟล์ทดสอบ:

```typescript
// test-connection.ts
import { connectToDatabase } from './src/lib/mongodb'

async function testConnection() {
  try {
    await connectToDatabase()
    console.log('✅ MongoDB Atlas connection successful!')
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error)
  }
}

testConnection()
```

## 7. ตัวอย่างการใช้งานใน API Routes

```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'

export async function GET() {
  try {
    await connectToDatabase()
    const products = await Product.find({})
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const product = await Product.create(body)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
```

## 8. การจัดการ Models

ตัวอย่าง Product Model:

```typescript
// src/models/Product.ts
import mongoose, { Document, Schema } from 'mongoose'

export interface IProduct extends Document {
  name: string
  price: number
  description: string
  category: string
  image: string
  stock: number
  createdAt: Date
  updatedAt: Date
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 }
}, {
  timestamps: true
})

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)
```

## 9. การแก้ไขปัญหาเบื้องต้น

### ปัญหาที่พบบ่อย:
1. **Connection timeout**: ตรวจสอบ Network Access และ IP whitelist
2. **Authentication failed**: ตรวจสอบ username/password และ database user permissions
3. **DNS resolution**: ตรวจสอบ internet connection และ DNS settings

### การ Debug:
```typescript
// เพิ่มใน .env.local
MONGODB_DEBUG=true
```

## 10. Security Best Practices

1. **อย่า commit .env.local** - เพิ่มใน .gitignore
2. **ใช้ environment variables** สำหรับ sensitive data
3. **จำกัด IP whitelist** สำหรับ production
4. **ใช้ database user ที่มีสิทธิ์จำกัด** ตามความจำเป็น

## 11. การ Deploy บน Vercel

เพิ่ม environment variables ใน Vercel:
1. ไปที่ Project Settings → Environment Variables
2. เพิ่ม `MONGO_URI` พร้อม connection string

---

หลังจากทำตามขั้นตอนทั้งหมดแล้ว ระบบของคุณจะสามารถเชื่อมต่อกับ MongoDB Atlas ได้สำเร็จ!
