import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Serve banners via API handler, but allow Next to serve public/uploads directly
  // (public/ is automatically served by Next; rewriting uploads can cause issues on some hosts)
  if (pathname.startsWith('/banners/')) {
    // ถ้าเป็น API call ให้ผ่านไป
    if (pathname.startsWith('/api/')) {
      return NextResponse.next()
    }

    // Rewrite banner requests to API static handler which can read banner binary data
    const newUrl = new URL(`/api/static${pathname}`, request.url)
    return NextResponse.rewrite(newUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
  '/banners/:path*',
  ],
}