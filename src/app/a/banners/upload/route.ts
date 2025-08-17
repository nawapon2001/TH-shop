import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import Banner from '@/models/Banner';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) {
    return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `${Date.now()}_${file.name}`;
  const filePath = path.join(process.cwd(), 'public', 'banners', fileName);

  await writeFile(filePath, buffer);

  await connectToDatabase();
  const banner = new Banner({ url: `/banners/${fileName}` });
  await banner.save();

  return NextResponse.json({ message: 'อัพโหลดสำเร็จ', url: banner.url });
}
