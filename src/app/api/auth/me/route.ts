import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, SESSION_COOKIE_NAME } from '@/lib/auth';

// =================================================================
// GET /api/auth/me
// Validates the session cookie and returns the current user.
// Used by the client to verify that a localStorage-hydrated session
// is still valid (cookie not expired / not revoked).
// Returns 401 if no valid session → client clears localStorage.
// =================================================================
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'نشست معتبر نیست' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'نشست منقضی شده است' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        phone: true,
        role: true,
        grade: true,
        major: true,
        goal: true,
        dailyTargetHours: true,
        assignedAdvisorId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth /me error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
