import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME || 'thai'
const COLLECTION = 'sellers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = body
    if (!username || !password) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 })
    }

    const client = await MongoClient.connect(MONGO_URI)
    const db = client.db(DB_NAME)
    const sellers = db.collection(COLLECTION)

    const seller = await sellers.findOne({ username })
    if (!seller) {
      client.close()
      return NextResponse.json({ message: 'ไม่พบผู้ใช้' }, { status: 401 })
    }

    const match = await bcrypt.compare(password, seller.password)
    client.close()
    if (!match) {
      return NextResponse.json({ message: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    // ส่งข้อมูลผู้ขาย (ไม่รวมรหัสผ่าน)
    const { password: _, ...safeSeller } = seller
    return NextResponse.json({ ok: true, seller: safeSeller })
  } catch (err) {
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }, { status: 500 })
  }
}
