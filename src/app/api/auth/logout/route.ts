import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

// =================================================================
// POST /api/auth/logout
// Clears the session cookie by setting it to an empty value with
// Max-Age=0. The client then redirects to the landing page.
// =================================================================
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
