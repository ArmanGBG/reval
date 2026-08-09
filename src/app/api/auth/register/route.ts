import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken, SESSION_COOKIE_NAME, getSessionCookieOptions } from '@/lib/auth';
import { normalizeIranianPhone } from '@/lib/phone';
import { verifyOtp } from '@/lib/otp';
import { createPublicCode } from '@/lib/public-code';

// ===== POST /api/auth/register =====
// Sign-up / onboarding endpoint.
//
// Creates a new user from the onboarding wizard payload and issues a signed
// session cookie so the user is immediately authenticated for all subsequent
// /api/* calls (tasks, exams, messages, ...).
//
// Public registration always creates a STUDENT. Role input from the client is
// intentionally ignored; advisors are created by a super-admin only.
//
// Body:
//   phone            string  required (Iranian mobile, digits only)
//   name             string  required
//   avatar           string  optional (emoji, defaults to 🦊)
//   grade            string  optional (دهم | یازدهم | دوازدهم | پشت کنکوری) — STUDENT only
//   major            string  optional (تجربی | ریاضی | انسانی) — STUDENT only
//   goal             string  optional (کنکور | نهایی | هر دو)
//   dailyTargetHours number  optional (default 6) — STUDENT only
//   otp              string  required, six digits verified server-side
//
// Returns: { user, token, message } and sets the `reval-session` httpOnly cookie.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const avatar = typeof body.avatar === 'string' && body.avatar ? body.avatar : '🦊';
    const grade = typeof body.grade === 'string' ? body.grade : null;
    const major = typeof body.major === 'string' ? body.major : null;
    const goal = typeof body.goal === 'string' ? body.goal : null;
    const dailyTargetHours =
      typeof body.dailyTargetHours === 'number' && body.dailyTargetHours > 0
        ? Math.min(Math.floor(body.dailyTargetHours), 16)
        : 6;
    const role = 'STUDENT' as const;

    if (!phone) {
      return NextResponse.json(
        { error: 'شماره تلفن الزامی است' },
        { status: 400 },
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: 'نام الزامی است' },
        { status: 400 },
      );
    }
    if (!grade) {
        return NextResponse.json(
          { error: 'پایه تحصیلی برای دانش‌آموز الزامی است' },
          { status: 400 },
        );
    }
    if (!major) {
        return NextResponse.json(
          { error: 'رشته تحصیلی برای دانش‌آموز الزامی است' },
          { status: 400 },
        );
    }

    const normalizedPhone = normalizeIranianPhone(phone);
    if (!normalizedPhone) return NextResponse.json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });
    const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
    if (!/^\d{6}$/.test(otp) || !(await verifyOtp(normalizedPhone, 'SIGNUP', otp))) {
      return NextResponse.json({ error: 'کد تایید نامعتبر یا منقضی شده است' }, { status: 401 });
    }

    const existing = await db.user.findUnique({
      where: { phone: normalizedPhone },
    });

    let user;
    if (existing) {
      if (existing.role !== 'STUDENT') return NextResponse.json({ error: 'این شماره متعلق به حساب دیگری است' }, { status: 409 });
      if (!existing.isActive) {
        return NextResponse.json(
          { error: 'حساب شما غیرفعال شده است' },
          { status: 403 },
        );
      }
      // Refresh profile fields from the onboarding wizard (non-destructive: only
      // overwrite fields the wizard actually collected).
      user = await db.user.update({
        where: { id: existing.id },
        data: {
          name,
          avatar,
          ...(grade ? { grade } : {}),
          ...(major ? { major } : {}),
          ...(goal ? { goal } : {}),
          dailyTargetHours,
          phoneVerifiedAt: existing.phoneVerifiedAt || new Date(),
        },
      });
    } else {
      // Brand-new account.
      user = await db.user.create({
        data: { phone: normalizedPhone, name, avatar, role, publicCode: await createPublicCode('STU'), grade: grade || 'دوازدهم', major: major || 'تجربی', goal: goal || 'کنکور', dailyTargetHours, isActive: true, phoneVerifiedAt: new Date() },
      });
    }

    // Strip password before returning.
    const { password: _, ...userWithoutPassword } = user;

    const token = generateToken(user.id);
    const response = NextResponse.json({
      user: userWithoutPassword,
      message: 'حساب شما با موفقیت ساخته شد',
    });

    // Set httpOnly session cookie.
    // Uses SameSite=None+Secure over HTTPS (cross-site preview iframe compat).
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(request));

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'خطای سرور. لطفاً دوباره تلاش کنید' },
      { status: 500 },
    );
  }
}
