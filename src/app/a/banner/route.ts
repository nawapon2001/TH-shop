import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { connectToDatabase } from '@/lib/mongodb';
import Banner from '@/models/Banner';

const uploadDir = path.join(process.cwd(), 'public', 'banners');

export async function POST(req: NextRequest) {
  // Ensure upload directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  const formData = await req.formData();
  const file = formData.get('banner') as File;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = Date.now() + '-' + file.name.replace(/\s+/g, '-');
  const filePath = path.join(uploadDir, filename);

  await fs.writeFile(filePath, buffer);

  // Save banner info to a JSON file (simple DB substitute)
  const bannerJsonPath = path.join(uploadDir, 'banners.json');
  let banners: { _id: string; image: string }[] = [];
  try {
    const json = await fs.readFile(bannerJsonPath, 'utf-8');
    banners = JSON.parse(json);
  } catch {}
  const newBanner = {
    _id: filename,
    image: `/banners/${filename}`,
  };
  banners.push(newBanner);
  await fs.writeFile(bannerJsonPath, JSON.stringify(banners, null, 2));

  // ---- ADD: Save to MongoDB ----
  try {
    await connectToDatabase();
    await Banner.create({
      filename,
      image: buffer, // Store buffer in MongoDB
      contentType: file.type,
      url: `/banners/${filename}`,
      isSmall: formData.get('isSmall') === '1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (err) {
    // Optionally log error, but don't fail the request
    console.error('MongoDB banner insert error:', err);
  }
  // ---- END ADD ----

  return NextResponse.json(newBanner);
}

export async function GET() {
  const bannerJsonPath = path.join(uploadDir, 'banners.json');
  try {
    const json = await fs.readFile(bannerJsonPath, 'utf-8');
    const banners = JSON.parse(json);
    return NextResponse.json(banners);
  } catch {
    return NextResponse.json([]);
  }
}
