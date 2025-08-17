import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Banner from '@/models/Banner';

export async function GET() {
  try {
    await connectToDatabase();
    const banners = await Banner.find();
    
    // Convert Buffer data to base64 string for frontend display
    const formattedBanners = banners.map(banner => ({
      _id: banner._id,
      image: `data:${banner.contentType};base64,${banner.image.toString('base64')}`,
      contentType: banner.contentType,
      filename: banner.filename,
      url: banner.url,
      isSmall: banner.isSmall,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt
    }));
    
    return NextResponse.json(formattedBanners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await connectToDatabase();
    await Banner.deleteOne({ _id: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
