import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge, SESSION_COOKIE_NAME } from '@/lib/edge-auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow health check at /api
  if (pathname === '/api') {
    return NextResponse.next();
  }

  // Allow login route without authentication
  if (pathname === '/api/auth/login') {
    return NextResponse.next();
  }

  // Protect all other /api/* routes
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'احراز هویت_REQUIRED' },
        { status: 401 }
      );
    }

    const payload = await verifyTokenEdge(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'نشست نامعتبر یا منقضی شده' },
        { status: 401 }
      );
    }

    // Add userId to request headers so API routes can access it
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
