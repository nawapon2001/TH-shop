import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME || 'thai'
const COLLECTION = 'sellers'

export async function POST(req: NextRequest) {
  let client: MongoClient | null = null
  try {
    const body = await req.json()
    const {
      username, password, fullName, email, phone,
      shopName, birthDate, province, address
    } = body

    // Basic validation
    if (!username || !password || !fullName || !email || !phone || !shopName || !birthDate || !province || !address) {
      return NextResponse.json({ message: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
    }

    // Connect MongoDB (catch connection error)
    try {
      client = await MongoClient.connect(MONGO_URI)
    } catch (err) {
      return NextResponse.json({ message: 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ' }, { status: 500 })
    }
    const db = client.db(DB_NAME)
    const sellers = db.collection(COLLECTION)

    // Check duplicate username/email/shopName
    const exists = await sellers.findOne({
      $or: [
        { username },
        { email },
        { shopName }
      ]
    })
    if (exists) {
      client.close()
      return NextResponse.json({ message: 'ชื่อผู้ใช้/อีเมล/ชื่อร้านนี้ถูกใช้แล้ว' }, { status: 409 })
    }

    // Hash password (catch error)
    let hashed = ''
    try {
      hashed = await bcrypt.hash(password, 10)
    } catch (err) {
      client.close()
      return NextResponse.json({ message: 'เข้ารหัสรหัสผ่านไม่สำเร็จ' }, { status: 500 })
    }

    // Insert seller (catch error)
    try {
      await sellers.insertOne({
        username,
        password: hashed,
        fullName,
        email,
        phone,
        shopName,
        birthDate,
        province,
        address,
        createdAt: new Date()
      })
    } catch (err) {
      client.close()
      return NextResponse.json({ message: 'บันทึกข้อมูลไม่สำเร็จ' }, { status: 500 })
    }

    client.close()
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (client) client.close()
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการสมัคร' }, { status: 500 })
  }
}
