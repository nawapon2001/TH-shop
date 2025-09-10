import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json([], { status: 500 });
    }
    
    const db = client.db('signshop'); // ใช้ชื่อ database ของคุณ
    const categories = await db.collection('categories').find({}).toArray();
    
    // ส่งกลับเป็น array ของ string ชื่อหมวดหมู่
    const categoryNames = categories.map((cat: any) => cat.name);
    return NextResponse.json(categoryNames);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get('name');
    const icon = formData.get('icon');
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ message: 'ชื่อหมวดหมู่ไม่ถูกต้อง' }, { status: 400 });
    }

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ message: 'ไม่สามารถเชื่อมต่อฐานข้อมูล' }, { status: 500 });
    }
    
    const db = client.db('signshop');
    
    // ตรวจสอบว่ามีหมวดหมู่นี้แล้วหรือไม่
    const existingCategory = await db.collection('categories').findOne({ name });
    if (existingCategory) {
      return NextResponse.json({ message: 'หมวดหมู่นี้มีอยู่แล้ว' }, { status: 400 });
    }

    // เพิ่มหมวดหมู่ใหม่
    await db.collection('categories').insertOne({ 
      name, 
      icon: icon || null,
      createdAt: new Date() 
    });

    return NextResponse.json({ message: 'เพิ่มหมวดหมู่สำเร็จ' });
  } catch (error) {
    console.error('Error adding category:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json({ message: 'กรุณาระบุชื่อหมวดหมู่' }, { status: 400 });
    }

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ message: 'ไม่สามารถเชื่อมต่อฐานข้อมูล' }, { status: 500 });
    }
    
    const db = client.db('signshop');
    
    // ลบหมวดหมู่จากฐานข้อมูล
    const result = await db.collection('categories').deleteOne({ name });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'ไม่พบหมวดหมู่ที่ต้องการลบ' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' }, { status: 500 });
  }
}
