import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, getClearCookieOptions } from '@/lib/auth';

// =================================================================
// POST /api/auth/logout
// Clears the session cookie by setting it to an empty value with
// Max-Age=0. The client then redirects to the landing page.
//
// The sameSite/secure attributes must match the original cookie or the
// browser won't delete it, so we use the same logic as login/register.
// =================================================================
export async function POST(request: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, '', getClearCookieOptions(request));
  return res;
}
