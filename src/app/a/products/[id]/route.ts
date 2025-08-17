import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { NextResponse } from 'next/server'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    await Product.findByIdAndDelete(params.id)
    return NextResponse.json({ message: 'ลบสินค้าสำเร็จ' })
  } catch (error) {
    return NextResponse.json({ message: 'ลบสินค้าไม่สำเร็จ' }, { status: 500 })
  }
}

// เพิ่ม GET สำหรับดึงข้อมูลสินค้าแต่ละชิ้น
export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { params } = context;
    // ตรวจสอบ params.id ว่ามีหรือไม่
    if (!params?.id) {
      return NextResponse.json({ message: 'กรุณาระบุ id' }, { status: 400 });
    }
    // ตรวจสอบว่า id เป็น ObjectId ที่ถูกต้องหรือไม่
    if (!/^[0-9a-fA-F]{24}$/.test(params.id)) {
      return NextResponse.json({ message: 'id ไม่ถูกต้อง' }, { status: 400 });
    }
    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json({ message: 'ไม่พบสินค้า' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
