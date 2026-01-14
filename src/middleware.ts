import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const pathname = request.nextUrl.pathname;

  // Only apply CORS to API routes
  if (pathname.startsWith('/api/')) {
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      
      // Allow all origins for development (same-origin requests may have empty origin)
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
      
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }

    // Handle actual request
    const response = NextResponse.next();
    
    // Allow all origins for development
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
};

