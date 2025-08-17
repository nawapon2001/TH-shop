import { connectToDatabase } from '@/lib/mongodb'
import Product from '@/models/Product'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    await connectToDatabase()
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const name = formData.get('name') as string;
      const price = Number(formData.get('price'));
      const category = formData.get('category') as string;
      const description = formData.get('description') as string;
      
      // Handle multiple images
      const files = formData.getAll('images') as File[];
      const images: string[] = [];
      
      // Process each image file
      for (const file of files) {
        if (file && file instanceof File) {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
          images.push(base64Image);
        }
      }
      
      // Use first image as main image for backward compatibility
      const image = images.length > 0 ? images[0] : '';
      
      // Get options if provided
      const optionsStr = formData.get('options') as string || '[]';
      const options = JSON.parse(optionsStr);
      
      const product = new Product({ 
        name, 
        price, 
        category, 
        description, 
        image,
        images,
        options // Add options if provided
      });
      await product.save();
      return NextResponse.json({ message: 'เพิ่มสินค้าแล้ว' });
    } else {
      const data = await req.json()
      const product = new Product(data)
      await product.save()
      return NextResponse.json({ message: 'เพิ่มสินค้าแล้ว' })
    }
  } catch (error) {
    console.error('Error adding product:', error);
    return NextResponse.json({ message: 'เพิ่มสินค้าไม่สำเร็จ' }, { status: 500 })
  }
}

export async function GET() {
  try {
    await connectToDatabase()
    const products = await Product.find()
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ message: 'ดึงสินค้าไม่สำเร็จ' }, { status: 500 })
  }
}
