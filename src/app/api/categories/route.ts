import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // ส่งกลับข้อมูลเต็มของหมวดหมู่
    const categoryData = categories.map((cat) => ({
      name: cat.name,
      icon: cat.icon || null,
      iconType: cat.iconType || null,
      iconName: cat.iconName || null,
      createdAt: cat.createdAt
    }));
    
    return NextResponse.json(categoryData);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get('name');
    const iconType = formData.get('iconType'); // 'system' หรือ 'upload'
    const iconName = formData.get('iconName'); // ชื่อไอคอนจากระบบ
    const icon = formData.get('icon'); // ไฟล์ที่อัปโหลด
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ message: 'ชื่อหมวดหมู่ไม่ถูกต้อง' }, { status: 400 });
    }

    // ตรวจสอบว่ามีหมวดหมู่นี้แล้วหรือไม่
    const existingCategory = await prisma.category.findUnique({ 
      where: { name } 
    });
    
    if (existingCategory) {
      return NextResponse.json({ message: 'หมวดหมู่นี้มีอยู่แล้ว' }, { status: 400 });
    }

    // เตรียมข้อมูลหมวดหมู่
    const categoryData: any = { 
      name
    };

    // เพิ่มข้อมูลไอคอนตามประเภท
    if (iconType === 'system' && iconName) {
      categoryData.iconType = 'system';
      categoryData.iconName = iconName as string;
    } else if (iconType === 'upload' && icon) {
      categoryData.iconType = 'upload';
      categoryData.icon = icon as string; // ในระบบจริงควรบันทึกเป็น URL หลังจากอัปโหลดไฟล์
    }

    // เพิ่มหมวดหมู่ใหม่
    await prisma.category.create({
      data: categoryData
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

    // ลบหมวดหมู่จากฐานข้อมูล
    const result = await prisma.category.delete({
      where: { name }
    });
    
    if (!result) {
      return NextResponse.json({ message: 'ไม่พบหมวดหมู่ที่ต้องการลบ' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' }, { status: 500 });
  }
}
