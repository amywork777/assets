import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Log the request path
  console.log('Request path:', request.nextUrl.pathname)
  
  // If trying to access /admin, redirect to the home page
  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) {
    console.log('Preventing redirect to /admin, redirecting to home page')
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // Pass the request through without modifying it
  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
} 