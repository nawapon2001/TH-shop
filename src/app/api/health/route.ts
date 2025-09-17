import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Simple query to test
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      status: 'OK',
      message: 'API and Database are working',
      database: {
        connected: true,
        userCount,
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'ERROR',
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development' ? String(error) : 'Connection error',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}