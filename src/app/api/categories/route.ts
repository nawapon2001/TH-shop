import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

let categoriesCache: string[] = [];

export async function GET() {
  // ใช้ cache ในหน่วยความจำ (หรือจะดึงจาก DB ก็ได้)
  return NextResponse.json(categoriesCache);
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const name = formData.get('name');
  // ถ้ามีการอัปโหลด icon
  const icon = formData.get('icon');
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ message: 'ชื่อหมวดหมู่ไม่ถูกต้อง' }, { status: 400 });
  }
  if (!categoriesCache.includes(name)) {
    categoriesCache.push(name);
  }
  return NextResponse.json({ message: 'เพิ่มหมวดหมู่สำเร็จ' });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  if (!name) {
    return NextResponse.json({ message: 'กรุณาระบุชื่อหมวดหมู่' }, { status: 400 });
  }
  // ลบจากฐานข้อมูลตามชื่อหมวดหมู่
  // เช่น await CategoryModel.deleteOne({ name });
  return NextResponse.json({ success: true });
}
