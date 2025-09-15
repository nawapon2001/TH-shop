import { MongoClient, ObjectId } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)

export async function GET() {
  try {
    await client.connect()
    const db = client.db('signshop')
    const collection = db.collection('announcements')
    
    // Get all active announcements, sorted by creation date (newest first)
    const announcements = await collection
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  } finally {
    await client.close()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, type = 'info', startDate, endDate, image } = body
    
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }
    
    await client.connect()
    const db = client.db('signshop')
    const collection = db.collection('announcements')
    
    const announcement = {
      title,
      content,
      type,
      isActive: true,
      image: image || null,
      startDate: startDate || null,
      endDate: endDate || null,
      createdAt: new Date().toISOString(),
    }
    
    const result = await collection.insertOne(announcement)
    
    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  } finally {
    await client.close()
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, isActive } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
    }
    
    await client.connect()
    const db = client.db('signshop')
    const collection = db.collection('announcements')
    
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: isActive !== undefined ? isActive : false } }
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
  } finally {
    await client.close()
  }
}

// DELETE - Delete announcement
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
    }
    
    await client.connect()
    const db = client.db('signshop')
    const collection = db.collection('announcements')
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Announcement deleted successfully' })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  } finally {
    await client.close()
  }
}
